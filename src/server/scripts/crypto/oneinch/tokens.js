const one_inch_viable_tokens = {
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": {
      symbol: "MATIC",
      name: "MATIC",
      decimals: 18,
      address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      logoURI:
        "https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png",
      tags: ["native"],
    },
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": {
      symbol: "DAI",
      name: "(PoS) Dai Stablecoin",
      decimals: 18,
      address: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      logoURI:
        "https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png",
      tags: ["tokens", "PEG:USD"],
    },
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6": {
      symbol: "WBTC",
      name: "Wrapped BTC",
      decimals: 8,
      address: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
      logoURI:
        "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
      tags: ["tokens", "PEG:BTC"],
    },
    "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": {
      symbol: "ETH",
      name: "Ether",
      decimals: 18,
      address: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
      logoURI:
        "https://tokens.1inch.io/0x7ceb23fd6bc0add59e62ac25578270cff1b9f619.png",
      tags: ["tokens"],
    },
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": {
      symbol: "USDC",
      name: "USD Coin (PoS)",
      decimals: 6,
      address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      logoURI:
        "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
      tags: ["tokens", "PEG:USD"],
    },
    "0x1a13f4ca1d028320a707d99520abfefca3998b7f": {
      symbol: "amUSDC",
      name: "Aave Matic Market USDC",
      decimals: 6,
      address: "0x1a13f4ca1d028320a707d99520abfefca3998b7f",
      logoURI:
        "https://tokens.1inch.io/0xbcca60bb61934080951369a648fb03df4f96263c.png",
      eip2612: true,
      tags: ["tokens", "PEG:USD"],
    },
    "0x60d55f02a771d515e077c9c2403a1ef324885cec": {
      symbol: "amUSDT",
      name: "Aave Matic Market USDT",
      decimals: 6,
      address: "0x60d55f02a771d515e077c9c2403a1ef324885cec",
      logoURI:
        "https://tokens.1inch.io/0x3ed3b47dd13ec9a98b44e6204a523e766b225811.png",
      eip2612: true,
      tags: ["tokens", "PEG:USD"],
    },
    "0x5c2ed810328349100a66b82b78a1791b101c9d61": {
      symbol: "amWBTC",
      name: "Aave Matic Market WBTC",
      decimals: 8,
      address: "0x5c2ed810328349100a66b82b78a1791b101c9d61",
      logoURI:
        "https://tokens.1inch.io/0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656.png",
      eip2612: true,
      tags: ["tokens", "PEG:BTC"],
    },
    "0x28424507fefb6f7f8e9d3860f56504e4e5f5f390": {
      symbol: "amWETH",
      name: "Aave Matic Market WETH",
      decimals: 18,
      address: "0x28424507fefb6f7f8e9d3860f56504e4e5f5f390",
      logoURI:
        "https://tokens.1inch.io/0x030ba81f1c18d280636f32af80b9aad02cf0854e.png",
      eip2612: true,
      tags: ["tokens"],
    },
    "0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4": {
      symbol: "amWMATIC",
      name: "Aave Matic Market WMATIC",
      decimals: 18,
      address: "0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4",
      logoURI:
        "https://tokens.1inch.io/0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4.png",
      eip2612: true,
      tags: ["tokens"],
    },
    "0x1d2a0e5ec8e5bbdca5cb219e649b565d8e5c3360": {
      symbol: "amAAVE",
      name: "Aave Matic Market AAVE",
      decimals: 18,
      address: "0x1d2a0e5ec8e5bbdca5cb219e649b565d8e5c3360",
      logoURI:
        "https://tokens.1inch.io/0xffc97d72e13e01096502cb8eb52dee56f74dad7b.png",
      eip2612: true,
      tags: ["tokens"],
    },
    "0x27f8d03b3a2196956ed754badc28d73be8830a6e": {
      symbol: "amDAI",
      name: "Aave Matic Market DAI",
      decimals: 18,
      address: "0x27f8d03b3a2196956ed754badc28d73be8830a6e",
      logoURI:
        "https://tokens.1inch.io/0x028171bca77440897b824ca71d1c56cac55b68a3.png",
      eip2612: true,
      tags: ["tokens"],
    },
    "0xd6df932a45c0f255f85145f286ea0b292b21c90b": {
      symbol: "AAVE",
      name: "Aave",
      decimals: 18,
      address: "0xd6df932a45c0f255f85145f286ea0b292b21c90b",
      logoURI:
        "https://tokens.1inch.io/0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9.png",
      tags: ["tokens"],
    },
    "0xb33eaad8d922b1083446dc23f610c2567fb5180f": {
      symbol: "UNI",
      name: "Uniswap",
      decimals: 18,
      address: "0xb33eaad8d922b1083446dc23f610c2567fb5180f",
      logoURI:
        "https://tokens.1inch.io/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png",
      tags: ["tokens"],
    },
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      logoURI:
        "https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
      tags: ["tokens", "PEG:USD"],
    },
    "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39": {
      symbol: "LINK",
      name: "ChainLink Token",
      decimals: 18,
      address: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39",
      logoURI:
        "https://tokens.1inch.io/0x514910771af9ca656af840dff83e8264ecf986ca.png",
      tags: ["tokens"],
    },
    "0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4": {
      symbol: "MANA",
      name: "Decentraland MANA",
      decimals: 18,
      address: "0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4",
      logoURI:
        "https://tokens.1inch.io/0x0f5d2fb29fb7d3cfee444a200298f468908cc942.png",
      tags: ["tokens"],
    },
    "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": {
      symbol: "WMATIC",
      name: "Wrapped Matic",
      decimals: 18,
      address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      logoURI:
        "https://tokens.1inch.io/0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270.png",
      wrappedNative: true,
      tags: ["tokens"],
    },
    "0x8505b9d2254a7ae468c0e9dd10ccea3a837aef5c": {
      symbol: "COMP",
      name: "Compound",
      decimals: 18,
      address: "0x8505b9d2254a7ae468c0e9dd10ccea3a837aef5c",
      logoURI:
        "https://tokens.1inch.io/0xc00e94cb662c3520282e6f5717214004a7f26888.png",
      tags: ["tokens"],
    },
    "0x361a5a4993493ce00f61c32d4ecca5512b82ce90": {
      symbol: "SDT",
      name: "Stake DAO Token",
      decimals: 18,
      address: "0x361a5a4993493ce00f61c32d4ecca5512b82ce90",
      logoURI:
        "https://tokens.1inch.io/0x73968b9a57c6e53d41345fd57a6e6ae27d6cdb2f.png",
      tags: ["tokens"],
    },
    "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a": {
      symbol: "SUSHI",
      name: "SushiToken",
      decimals: 18,
      address: "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a",
      logoURI:
        "https://tokens.1inch.io/0x6b3595068778dd592e39a122f4f5a5cf09c90fe2.png",
      tags: ["tokens"],
    },
    "0xfbdd194376de19a88118e84e279b977f165d01b8": {
      symbol: "BIFI",
      name: "beefy.finance",
      decimals: 18,
      address: "0xfbdd194376de19a88118e84e279b977f165d01b8",
      logoURI:
        "https://tokens.1inch.io/0xca3f508b8e4dd382ee878a314789373d80a5190a.png",
      eip2612: true,
      tags: ["tokens"],
    },
    "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3": {
      symbol: "BAL",
      name: "Balancer",
      decimals: 18,
      address: "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3",
      logoURI:
        "https://tokens.1inch.io/0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3.png",
      tags: ["tokens"],
    },
    "0xe7804d91dfcde7f776c90043e03eaa6df87e6395": {
      symbol: "DFX",
      name: "DFX Token (PoS)",
      decimals: 18,
      address: "0xe7804d91dfcde7f776c90043e03eaa6df87e6395",
      logoURI:
        "https://tokens.1inch.io/0xe7804d91dfcde7f776c90043e03eaa6df87e6395.png",
      tags: ["tokens"],
    },
    "0xfe712251173a2cd5f5be2b46bb528328ea3565e1": {
      symbol: "MVI",
      name: "Metaverse Index (PoS)",
      decimals: 18,
      address: "0xfe712251173a2cd5f5be2b46bb528328ea3565e1",
      logoURI:
        "https://tokens.1inch.io/0xfe712251173a2cd5f5be2b46bb528328ea3565e1.png",
      tags: ["tokens"],
    },
    "0x3a58a54c066fdc0f2d55fc9c89f0415c92ebf3c4": {
      symbol: "stMATIC",
      name: "Staked MATIC (PoS)",
      decimals: 18,
      address: "0x3a58a54c066fdc0f2d55fc9c89f0415c92ebf3c4",
      logoURI:
        "https://tokens.1inch.io/0x3a58a54c066fdc0f2d55fc9c89f0415c92ebf3c4.png",
      tags: ["tokens", "PEG:MATIC"],
    },
};
module.exports = {
    one_inch_viable_tokens
}