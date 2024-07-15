import {
  AbiEvent,
  Address,
  Chain,
  createPublicClient,
  createWalletClient,
  custom,
  CustomTransport,
  decodeAbiParameters,
  encodeAbiParameters,
  formatUnits,
  getContract,
  GetContractReturnType,
  GetFilterLogsReturnType,
  http,
  HttpTransport,
  keccak256,
  ParseAccount,
  PublicClient,
  toHex,
  WalletClient,
} from "viem";
import { usdcAbi } from "./contracts/usdc";
import { tokenMessagerAbi } from "./contracts/tokenMessager";
import { messageTransmitterAbi } from "./contracts/messageTransmitter";

interface USDCServiceConstructor {
  chain: Chain;
  domain: number;
  tokenAddress: Address;
  tokenMessengerAddress: Address;
  messageTransmitterAddress: Address;
}
interface GetLogOptions {
  lastBlock?: bigint;
}

export class USDCService {
  domain: number;
  client: PublicClient<
    HttpTransport,
    Chain,
    ParseAccount<undefined>,
    undefined
  >;
  walletClient: WalletClient<
    CustomTransport,
    Chain,
    ParseAccount<undefined>,
    undefined
  >;

  usdcContract: GetContractReturnType<
    typeof usdcAbi,
    PublicClient<HttpTransport, Chain, ParseAccount<undefined>, undefined>,
    any
  >;
  tokenMessengerContract: GetContractReturnType<
    typeof tokenMessagerAbi,
    PublicClient<HttpTransport, Chain, ParseAccount<undefined>, undefined>,
    any
  >;
  messageTransmitterContract: GetContractReturnType<
    typeof messageTransmitterAbi,
    PublicClient<HttpTransport, Chain, ParseAccount<undefined>, undefined>,
    any
  >;
  constructor({
    chain,
    domain,
    tokenAddress,
    tokenMessengerAddress,
    messageTransmitterAddress,
  }: USDCServiceConstructor) {
    this.client = createPublicClient({
      chain: chain,
      transport: http(),
    });
    this.walletClient = createWalletClient({
      chain: chain,
      transport: custom(window.ethereum!),
    });
    this.domain = domain;

    this.usdcContract = getContract({
      address: tokenAddress,
      abi: usdcAbi,
      client: { public: this.client, wallet: this.walletClient },
    });
    this.tokenMessengerContract = getContract({
      address: tokenMessengerAddress,
      abi: tokenMessagerAbi,
      client: { public: this.client, wallet: this.walletClient },
    });
    this.messageTransmitterContract = getContract({
      address: messageTransmitterAddress,
      abi: messageTransmitterAbi,
      client: { public: this.client, wallet: this.walletClient },
    });
  }

  async watchAsset() {
    const [symbol, decimals] = await Promise.all([
      this.usdcContract.read.symbol(),
      this.getDecimals(),
    ]);
    this.walletClient.watchAsset({
      type: "ERC20",
      options: {
        symbol: symbol,
        address: this.usdcContract.address,
        decimals: decimals,
      },
    });
  }

  async getLogs(address: Address, { lastBlock }: GetLogOptions = {}) {
    // const results: GetFilterLogsReturnType<
    //   typeof usdcAbi,
    //   "Transfer",
    //   undefined,
    //   undefined,
    //   undefined
    // > = [];
    const toBlock = lastBlock ?? (await this.client.getBlockNumber());
    let fromBlock: bigint = toBlock;
    const g = this.getLogsGenerator(address, { lastBlock: toBlock });

    const res = await Promise.all(
      Array.from({ length: 10 }).map(() => g.next()),
    );
    const results = res
      .map((res) => {
        if (res.done) {
          return [];
        }
        fromBlock = res.value.fromBlock;
        return res.value.logs;
      })
      .flat();
    return { fromBlock: fromBlock, logs: results };
  }
  async *getLogsGenerator(address: Address, { lastBlock }: GetLogOptions = {}) {
    let toBlock = lastBlock ?? (await this.client.getBlockNumber());
    const blockSize = 2048n;
    const event = {
      type: "event",
      name: "Transfer",
      inputs: [
        { type: "address", indexed: true, name: "from" },
        { type: "address", indexed: true, name: "to" },
        { type: "uint256", indexed: false, name: "value" },
      ],
    } as const;
    while (true) {
      const fromBlock = toBlock - blockSize + 1n;
      const [logsFrom, logsTo] = await Promise.all([
        this.client.getLogs({
          address: this.usdcContract.address,
          event: event,
          args: { from: address },
          fromBlock: fromBlock,
          toBlock: toBlock,
        }),
        this.client.getLogs({
          address: this.usdcContract.address,
          event: event,
          args: { to: address },
          fromBlock: fromBlock,
          toBlock: toBlock,
        }),
      ]);
      const totalLogs = [...logsFrom, ...logsTo];
      totalLogs.sort((a, b) => Number(a.blockNumber - b.blockNumber));
      toBlock = fromBlock;
      yield { fromBlock, logs: totalLogs };
    }
  }
  async switchChain() {
    return this.walletClient.addChain({ chain: this.walletClient.chain });
  }
  async getDecimals() {
    return this.usdcContract.read.decimals();
  }
  async getUnits(address: Address) {
    return this.usdcContract.read.balanceOf([address]);
  }

  async getBalance(address: Address) {
    const [decimals, units] = await Promise.all([
      this.getDecimals(),
      this.getUnits(address),
    ]);
    return formatUnits(units, decimals);
  }

  async currencyToUnit(currency: string): Promise<bigint> {
    const decimals = await this.getDecimals();
    return BigInt(Number(currency) * 10 ** decimals);
  }

  async approve(units: bigint) {
    await this.switchChain();
    const res = await this.usdcContract.write.approve(
      [this.tokenMessengerContract.address, units],
      { account: (await this.walletClient.getAddresses())[0] },
    );
    await this.client.waitForTransactionReceipt({ hash: res });
    return res;
  }

  async depositForBurn(
    units: bigint,
    targetDomain: number,
    targetAddress: Address,
  ) {
    await this.switchChain();
    const destinationAddressInBytes32 = encodeAbiParameters(
      [{ type: "address" }],
      [targetAddress],
    );
    const res = await this.tokenMessengerContract.write.depositForBurn(
      [
        units,
        targetDomain,
        destinationAddressInBytes32,
        this.usdcContract.address,
      ],
      { account: (await this.walletClient.getAddresses())[0] },
    );
    const receipt = await this.client.waitForTransactionReceipt({ hash: res });
    const eventTopic = keccak256(toHex("MessageSent(bytes)"));
    const log = receipt.logs.find((l) => l.topics[0] === eventTopic);
    const messageBytes = decodeAbiParameters([{ type: "bytes" }], log!.data)[0];
    return messageBytes;
  }

  async receiveMessage(messageBytes: Address, attestation: Address) {
    await this.switchChain();
    const tx = await this.messageTransmitterContract.write.receiveMessage(
      [messageBytes, attestation],
      { account: (await this.walletClient.getAddresses())[0] },
    );
    await this.client.waitForTransactionReceipt({ hash: tx });
    return tx;
  }
}
