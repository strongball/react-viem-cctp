import {
  Address,
  Chain,
  createPublicClient,
  createWalletClient,
  custom,
  CustomTransport,
  decodeAbiParameters,
  formatUnits,
  getContract,
  GetContractReturnType,
  hexToBytes,
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
import { TestNetDomain } from "./types";
import { messageTransmitterAbi } from "./contracts/messageTransmitter";

interface USDCServiceConstructor {
  chain: Chain;
  tokenAddress: Address;
  tokenMessengerAddress: Address;
  messageTransmitterAddress: Address;
}
export class USDCService {
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
  tokenAddress: Address;
  tokenMessengerAddress: Address;
  messageTransmitterAddress: Address;

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
    this.tokenAddress = tokenAddress;
    this.tokenMessengerAddress = tokenMessengerAddress;
    this.messageTransmitterAddress = messageTransmitterAddress;

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
        address: this.tokenAddress,
        decimals: decimals,
      },
    });
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
  async approve(units: bigint) {
    await this.switchChain();
    const res = await this.usdcContract.write.approve(
      [this.tokenMessengerAddress, units],
      { account: (await this.walletClient.getAddresses())[0] },
    );
    await this.client.waitForTransactionReceipt({ hash: res });
    return res;
  }
  async depositForBurn(
    units: bigint,
    targetDomain: TestNetDomain,
    targetAddress: Address,
  ) {
    await this.switchChain();
    const res = await this.tokenMessengerContract.write.depositForBurn(
      [
        units,
        targetDomain,
        toHex(hexToBytes(targetAddress, { size: 32 })),
        this.tokenAddress,
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
