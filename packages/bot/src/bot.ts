import {
    InlineKeyboard,
    ReplyKeyboard,
    ForceReply,
    Row,
    KeyboardButton,
    InlineKeyboardButton,
} from "node-telegram-keyboard-wrapper";
import TelegramBot from "node-telegram-bot-api";
import {ethers} from 'ethers'

const BOT_TOKEN = '6339170212:AAFRRoZyK50SHXVWD4vpOcRP1Wh7VovPOFA'

const bot = new TelegramBot(BOT_TOKEN, {polling: true})

const inlineActions = new InlineKeyboard();
const inlineNetworks = new InlineKeyboard();
const inlineConfirm = new InlineKeyboard();

inlineActions.push(
    new Row<InlineKeyboardButton>(
        new InlineKeyboardButton("Swap stETH to DAI", "callback_data", "action_swap_steth_to_dai"),
        new InlineKeyboardButton("Swap DAI to stETH", "callback_data", "action_swap_dai_to_steth"),
    ),
    new Row<InlineKeyboardButton>(
        new InlineKeyboardButton("Deposit DAI to sDAI", "callback_data", "action_deposit_dai_to_sdai"),
        new InlineKeyboardButton("Redeem sDAI", "callback_data", "action_redeem_sdai"),
    ),
    new Row<InlineKeyboardButton>(
        new InlineKeyboardButton("Bridge stETH from Goerli", "callback_data", "action_bridge_from_goerli"),
        new InlineKeyboardButton("Bridge stETH to Goerli", "callback_data", "action_bridge_to_goerli"),
    ),
)

inlineNetworks.push(
    new Row<InlineKeyboardButton>(
        new InlineKeyboardButton("Goerli ✅", "callback_data", "network_goerli"),
        new InlineKeyboardButton("Tenet ✅", "callback_data", "network_tenet"),
    ),
    new Row<InlineKeyboardButton>(
        new InlineKeyboardButton("Mantle ✅", "callback_data", "network_mantle"),
        new InlineKeyboardButton("Gnosis Chain ✅", "callback_data", "network_gnosis"),
    ),
    new Row<InlineKeyboardButton>(
        new InlineKeyboardButton("Celo ❓", "callback_data", "network_celo"),
        new InlineKeyboardButton("Linea ❌", "callback_data", "network_linea"),
        new InlineKeyboardButton("Neon ❌", "callback_data", "network_neon"),
    ),
)

inlineConfirm.push(
    new Row<InlineKeyboardButton>(
        new InlineKeyboardButton("Confirm transaction", "web_app", {url: "https://ethparis-hack-telegram-webapp.vercel.app/"}),
    ),
)

function hasBotCommands(entities: TelegramBot.MessageEntity[]) {
    if (!entities || !(entities instanceof Array)) {
        return false;
    }

    return entities.some((e) => e.type === "bot_command");
}

async function postJSON(data) {
    try {
        const response = await fetch("https://hook.eu1.make.com/ievohfqqeov5umvqigyov4j5gc2b2u0p", {
            method: "POST", // or 'PUT'
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        console.log("Success with fetch:", result);
        return result
    } catch (error) {
        console.error("Error with fetch:", error);
    }
}

/// ---- ADDRESSES

const SAFE = "0x77A71E9AE7b40c25dDAD3709A0EEeD35a1C0D079"

const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
const LIDO_ETH = "0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F"
const DAI = "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844"
const SDAI = "0xD8134205b0328F5676aaeFb3B2a0DC15f4029d8C"
const HYPERLANE_LIDO_ETH = {
    'network_goerli': "0xe2bA3dB075898EA3a2C5DDCddef8Db637A2c6210",
    'network_tenet': "0xEA45e0926D75360C7ea552A65e5B29a195564a04",
    'network_gnosis': "0xC0976A5C9655802fa6c80d837e75364C8fAE685a",
    'network_mantle': "0x29362e87cD7d9ad0f8c41Ab004a9F83fA5C001ba",
    'network_celo': "0x8817E1Fc86BB57eac74D96744BbC74B9Af0C31a8",
}

const CHAIN_IDS = {
    'network_goerli': 5,
    'network_tenet': 155,
    'network_mantle': 5001,
    'network_gnosis': 10200,
    'network_celo': 44787,
}

/// ---- ABI

const UNISWAP_ROUTER_ABI = [
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)",
]
const ERC_20_ABI = [
    "function approve(address spender, uint256 amount)",
]
const HYPERLANE_ERC_20_ABI = [
    "function approve(address spender, uint256 amount)",
    "function transferRemote(uint32 _destination, bytes32 _recipient, uint256 _amount)"
]
const SDAI_ABI = [
    'function deposit(uint256 assets,address receiver)',
    'function redeem(uint256 shares,address receiver,address owner)',
]

let cache = {}

function addressToBytes32(address: string): string {
    return ethers.utils
        .hexZeroPad(ethers.utils.hexStripZeros(address), 32)
        .toLowerCase();
}

function getCalldata(msgId: string) {
    const uniswapInterface = new ethers.utils.Interface(UNISWAP_ROUTER_ABI);
    const erc20Interface = new ethers.utils.Interface(ERC_20_ABI);
    const hyperlaneErc20Interface = new ethers.utils.Interface(HYPERLANE_ERC_20_ABI);
    const sdaiInterface = new ethers.utils.Interface(SDAI_ABI);

    const data = cache[msgId]
    const chainId = CHAIN_IDS[data.network]

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600 * 10)

    console.log({data, chainId, deadline})


    switch (data.action) {
        case 'action_swap_steth_to_dai':
            cache[msgId] = {...data, to: UNISWAP_ROUTER}
            return uniswapInterface.encodeFunctionData('swapExactTokensForTokens', [ethers.utils.parseEther(data.amount), 0, [LIDO_ETH, DAI], SAFE, deadline])
        case 'action_swap_dai_to_steth':
            cache[msgId] = {...data, to: UNISWAP_ROUTER}
            return uniswapInterface.encodeFunctionData('swapExactTokensForTokens', [ethers.utils.parseEther(data.amount), 0, [DAI, LIDO_ETH], SAFE, deadline])
        case 'action_deposit_dai_to_sdai':
            cache[msgId] = {...data, to: SDAI}
            return sdaiInterface.encodeFunctionData('deposit', [ethers.utils.parseEther(data.amount), SAFE])
        case 'action_redeem_sdai':
            cache[msgId] = {...data, to: SDAI}
            return sdaiInterface.encodeFunctionData('redeem', [ethers.utils.parseEther(data.amount), SAFE, SAFE])
        case 'action_bridge_from_goerli':
            cache[msgId] = {...data, to: HYPERLANE_LIDO_ETH.network_goerli}
            return hyperlaneErc20Interface.encodeFunctionData('transferRemote', [chainId, addressToBytes32(SAFE), ethers.utils.parseEther(data.amount)])
        case 'action_bridge_to_goerli':
            cache[msgId] = {...data, to: HYPERLANE_LIDO_ETH.network_goerli}
            return '0xdeadbeef'
        case 'approve_lido_to_collateral':
            cache[msgId] = {...data, to: LIDO_ETH}
            return erc20Interface.encodeFunctionData('approve', [HYPERLANE_LIDO_ETH[data.network], ethers.utils.parseEther(data.amount)])
        case 'approve_to_uniswap':
            cache[msgId] = {...data, to: UNISWAP_ROUTER}
            return erc20Interface.encodeFunctionData('approve', [UNISWAP_ROUTER, ethers.utils.parseEther(data.amount)])
        default:
            throw new Error('Unknown action in getCalldata')
    }
}


bot.onText(/\/actions/i, (msg) => {
    const options: TelegramBot.SendMessageOptions = {
        reply_markup: inlineActions.getMarkup(),
    };

    bot.sendMessage(msg.from.id, "Select one of the actions:", options);
});

bot.on('message', async (msg) => {
    if (!hasBotCommands(msg.entities)) {
        if (!!msg.reply_to_message) {
            console.log({msg})
            cache[msg.from.id] = { ...cache[msg.from.id], amount: msg.text }
            await bot.sendMessage(
                msg.from.id,
                `[DEBUG] Action: ${cache[msg.from.id].action} + Network: ${cache[msg.from.id].network} + Amount: ${cache[msg.from.id].amount}`
            );
            const calldata = getCalldata(msg.from.id)
            console.log({calldata, to: cache[msg.from.id].to})
            await postJSON({ walletAddress: msg.from.id, calldata, to: cache[msg.from.id].to })

            const options: TelegramBot.SendMessageOptions = {
                reply_markup: inlineConfirm.getMarkup(),
            };
            await bot.sendMessage(
                msg.from.id,
                "Press the button to confirm the transaction:",
                options,
            );
            const response = await postJSON({ walletAddress: msg.from.id })
            console.log({response})
        }
    }
});

bot.on("callback_query", async (query) => {
    console.log({query})
    if ((query.data as string).includes("action")) {
        cache[query.from.id] = { action: query.data }

        const options: TelegramBot.SendMessageOptions = {
            reply_markup: inlineNetworks.getMarkup(),
        };
        await bot.sendMessage(
            query.from.id,
            "Select network for the action:",
            options,
        );
        return;
    } else if ((query.data as string).includes("network")) {
        cache[query.from.id] = { ...cache[query.from.id], network: query.data }

        const options: TelegramBot.SendMessageOptions = {
            reply_markup: ForceReply.getMarkup(),
        };

        bot.sendMessage(
            query.from.id,
            "Amount of tokens for the action:",
            options,
        );
    } else {
        cache[query.from.id] = { ...cache[query.from.id], network: query.data }

        // await bot.answerCallbackQuery(query.id, { text: "Action received!" });
        await bot.sendMessage(
            query.from.id,
            `Action: ${cache[query.from.id].action} + Network: ${cache[query.from.id].network}`
        );
        await bot.sendMessage(
            query.from.id,
            `THIS SHOULD NEVER HAPPEN`
        );
    }
});

bot.on("polling_error", (err) => console.log(err));