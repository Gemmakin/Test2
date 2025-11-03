// Web3 and Wallet State
let web3;
let walletState = {
    connected: false,
    walletType: null,
    address: null,
    balance: '0',
    network: null,
    chainId: null,
    walletName: null
};

// Trading State (simulation)
let tradingState = {
    virtualBalance: 10000,
    portfolio: {},
    tradeHistory: [],
    availableCoins: [
        { symbol: 'DOGE', name: 'Dogecoin', price: 0.15 },
        { symbol: 'SHIB', name: 'Shiba Inu', price: 0.000008 },
        { symbol: 'PEPE', name: 'Pepe Coin', price: 0.0000012 },
        { symbol: 'FLOKI', name: 'Floki Inu', price: 0.000025 },
        { symbol: 'BONK', name: 'Bonk', price: 0.000012 },
        { symbol: 'WIF', name: 'dogwifhat', price: 0.35 }
    ]
};

// Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    checkMetaMaskAvailability();
    loadSavedWallet();
});

// Check if MetaMask is installed
function checkMetaMaskAvailability() {
    if (typeof window.ethereum !== 'undefined') {
        document.getElementById('metamask-status').textContent = 'DETECTED';
        document.getElementById('metamask-status').style.background = '#10b981';
    } else {
        document.getElementById('metamask-status').textContent = 'NOT FOUND';
        document.getElementById('metamask-status').style.background = '#ef4444';
    }
}

// Load saved wallet connection
function loadSavedWallet() {
    const saved = localStorage.getItem('cypherx_wallet_connection');
    if (saved) {
        const walletData = JSON.parse(saved);
        if (walletData.connected && walletData.address) {
            initializeWeb3(walletData.walletType);
        }
    }
}

// Initialize Web3
async function initializeWeb3(walletType) {
    try {
        if (walletType === 'metamask' && typeof window.ethereum !== 'undefined') {
            web3 = new Web3(window.ethereum);
            await connectMetaMaskWallet();
        } else if (walletType === 'walletconnect') {
            await connectWalletConnect();
        } else if (walletType === 'coinbase') {
            await connectCoinbaseWallet();
        } else if (walletType === 'phantom') {
            await connectPhantomWallet();
        }
    } catch (error) {
        showError('Failed to initialize wallet: ' + error.message);
    }
}

// MetaMask Connection
async function connectMetaMask() {
    if (typeof window.ethereum === 'undefined') {
        showError('MetaMask not detected! Please install MetaMask first.');
        return;
    }

    showSection('connection-loading');
    updateLoadingMessage('Connecting to MetaMask...');

    try {
        web3 = new Web3(window.ethereum);
        
        // Request account access
        updateLoadingMessage('Requesting account access...');
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });

        if (accounts.length === 0) {
            throw new Error('No accounts found');
        }

        const address = accounts[0];
        updateLoadingMessage('Getting wallet information...');

        // Get network info
        const chainId = await web3.eth.getChainId();
        const network = getNetworkName(chainId);

        // Get balance
        const balanceWei = await web3.eth.getBalance(address);
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');

        // Update wallet state
        walletState = {
            connected: true,
            walletType: 'metamask',
            address: address,
            balance: balanceEth,
            network: network,
            chainId: chainId,
            walletName: 'MetaMask'
        };

        // Save connection
        saveWalletConnection();
        
        // Update UI
        updateWalletUI();
        showSuccessModal();
        
    } catch (error) {
        showError('MetaMask connection failed: ' + error.message);
    }
}

// WalletConnect Connection (simplified)
async function connectWalletConnect() {
    showError('WalletConnect integration requires additional setup. Using MetaMask for demo.');
    // En production, tu intégrerais le vrai WalletConnect
}

// Coinbase Wallet Connection
async function connectCoinbaseWallet() {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet) {
        await connectMetaMask(); // Coinbase Wallet utilise la même API
    } else {
        showError('Coinbase Wallet not detected!');
    }
}

// Phantom Wallet Connection (Solana)
async function connectPhantom() {
    if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
        try {
            showSection('connection-loading');
            updateLoadingMessage('Connecting to Phantom...');
            
            const response = await window.solana.connect();
            const publicKey = response.publicKey.toString();
            
            walletState = {
                connected: true,
                walletType: 'phantom',
                address: publicKey,
                balance: '0', // Tu devrais fetch le vrai balance Solana
                network: 'Solana',
                chainId: 'solana',
                walletName: 'Phantom'
            };

            saveWalletConnection();
            updateWalletUI();
            showSuccessModal();
            
        } catch (error) {
            showError('Phantom connection failed: ' + error.message);
        }
    } else {
        showError('Phantom Wallet not detected! Please install Phantom.');
    }
}

// Get network name from chainId
function getNetworkName(chainId) {
    const networks = {
        1: 'Ethereum Mainnet',
        5: 'Goerli Testnet',
        137: 'Polygon Mainnet',
        56: 'BNB Smart Chain',
        42161: 'Arbitrum One',
        10: 'Optimism',
        43114: 'Avalanche C-Chain'
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
}

// Update Wallet UI
function updateWalletUI() {
    if (!walletState.connected) return;

    // Update header
    document.getElementById('wallet-address').textContent = 
        `${walletState.address.substring(0, 6)}...${walletState.address.substring(walletState.address.length - 4)}`;
    document.getElementById('wallet-balance').textContent = `${parseFloat(walletState.balance).toFixed(4)} ${getCurrencySymbol()}`;

    // Update wallet info section
    document.getElementById('wallet-type-display').textContent = walletState.walletName;
    document.getElementById('wallet-full-address').textContent = walletState.address;
    document.getElementById('network-info').textContent = walletState.network;
    document.getElementById('wallet-full-balance').textContent = `${parseFloat(walletState.balance).toFixed(6)} ${getCurrencySymbol()}`;
    document.getElementById('connection-time').textContent = new Date().toLocaleString();

    // Update dashboard
    document.getElementById('real-balance').textContent = `${parseFloat(walletState.balance).toFixed(4)} ${getCurrencySymbol()}`;
    document.getElementById('network-name').textContent = walletState.network;
    document.getElementById('network-dot').style.background = getNetworkColor();

    // Show connected state
    document.getElementById('wallet-connected').classList.remove('hidden');
    document.getElementById('connect-wallet-btn').classList.add('hidden');
    document.getElementById('wallet-connect').classList.remove('active');
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('bottom-nav').classList.remove('hidden');

    // Update success modal
    document.getElementById('connected-address-display').textContent = walletState.address;
    document.getElementById('connected-network').textContent = walletState.network;
}

function getCurrencySymbol() {
    return walletState.walletType === 'phantom' ? 'SOL' : 'ETH';
}

function getNetworkColor() {
    const colors = {
        'Ethereum Mainnet': '#3c3c3d',
        'Polygon Mainnet': '#8247e5',
        'BNB Smart Chain': '#f0b90b',
        'Solana': '#9945ff'
    };
    return colors[walletState.network] || '#6366f1';
}

// Save wallet connection
function saveWalletConnection() {
    localStorage.setItem('cypherx_wallet_connection', JSON.stringify({
        ...walletState,
        connectedAt: new Date().toISOString()
    }));
}

// Disconnect Wallet
function disconnectWallet() {
    walletState = {
        connected: false,
        walletType: null,
        address: null,
        balance: '0',
        network: null,
        chainId: null,
        walletName: null
    };

    // Reset UI
    document.getElementById('wallet-connected').classList.add('hidden');
    document.getElementById('connect-wallet-btn').classList.remove('hidden');
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('wallet-connect').classList.add('active');
    document.getElementById('bottom-nav').classList.add('hidden');

    // Clear storage
    localStorage.removeItem('cypherx_wallet_connection');
    
    // Reset trading state
    tradingState.virtualBalance = 10000;
    tradingState.portfolio = {};
    tradingState.tradeHistory = [];
    
    updateTradingUI();
}

// Trading Functions (simulation)
function setupTradingInterface() {
    const container = document.getElementById('coins-grid');
    if (!container) return;
    
    container.innerHTML = tradingState.availableCoins.map(coin => `
        <div class="trade-btn buy" onclick="executeTrade('BUY', '${coin.symbol}')">
            📈 BUY ${coin.symbol}
        </div>
        <div class="trade-btn sell" onclick="executeTrade('SELL', '${coin.symbol}')">
            📉 SELL ${coin.symbol}
        </div>
    `).join('');
}

function executeTrade(action, coinSymbol) {
    if (!walletState.connected) {
        showError('Please connect your wallet first!');
        showSection('wallet-connect');
        return;
    }

    const coin = tradingState.availableCoins.find(c => c.symbol === coinSymbol);
    if (!coin) return;

    const amount = Math.floor(Math.random() * 500) + 10;
    const cost = amount * coin.price;

    // Simulation trading logic
    if (action === 'BUY') {
        if (cost > tradingState.virtualBalance) {
            showError('Insufficient virtual balance');
            return;
        }
        tradingState.virtualBalance -= cost;
        if (!tradingState.portfolio[coinSymbol]) {
            tradingState.portfolio[coinSymbol] = { amount: 0, cost: 0 };
        }
        tradingState.portfolio[coinSymbol].amount += amount;
        tradingState.portfolio[coinSymbol].cost += cost;
    } else {
        if (!tradingState.portfolio[coinSymbol] || tradingState.portfolio[coinSymbol].amount < amount) {
            showError('Insufficient coins');
            return;
        }
        const revenue = amount * coin.price;
        tradingState.virtualBalance += revenue;
        tradingState.portfolio[coinSymbol].amount -= amount;
    }

    const trade = {
        coin: coinSymbol,
        action: action,
        amount: amount,
        price: coin.price,
        time: new Date().toLocaleTimeString(),
        signal: document.getElementById('trade-signal').textContent
    };
    
    tradingState.tradeHistory.push(trade);
    simulateMarketMove();
    saveTradingState();
    updateTradingUI();
}

function updateTradingUI() {
    document.getElementById('virtual-balance').textContent = `$${tradingState.virtualBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const portfolioValue = calculatePortfolioValue();
    document.getElementById('portfolio-value').textContent = `$${portfolioValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const pnl = portfolioValue - 10000;
    document.getElementById('pnl').textContent = `${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    document.getElementById('pnl').style.color = pnl >= 0 ? '#10b981' : '#ef4444';

    document.getElementById('total-trades').textContent = tradingState.tradeHistory.length;
    document.getElementById('cash-balance').textContent = `$${tradingState.virtualBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    updateRecentTrades();
    updatePortfolioView();
}

function calculatePortfolioValue() {
    let total = tradingState.virtualBalance;
    for (const [symbol, position] of Object.entries(tradingState.portfolio)) {
        const coin = tradingState.availableCoins.find(c => c.symbol === symbol);
        if (coin) {
            total += position.amount * coin.price;
        }
    }
    return total;
}

function updateRecentTrades() {
    const container = document.getElementById('recent-trades');
    const recentTrades = tradingState.tradeHistory.slice(-5).reverse();

    if (recentTrades.length === 0) {
        container.innerHTML = '<div class="no-trades">No trades yet</div>';
        return;
    }

    container.innerHTML = recentTrades.map(trade => `
        <div class="trade-item">
            <div class="trade-info">
                <span class="trade-action ${trade.action.toLowerCase()}">${trade.action}</span>
                <span class="trade-amount">${trade.amount} ${trade.coin}</span>
            </div>
            <div class="trade-price">$${trade.price.toFixed(8)}</div>
        </div>
    `).join('');
}

function updatePortfolioView() {
    const container = document.getElementById('portfolio-positions');
    const positions = Object.entries(tradingState.portfolio);
    
    if (positions.length === 0) {
        container.innerHTML = '<div class="no-positions">No positions open</div>';
        return;
    }
    
    container.innerHTML = positions.map(([symbol, position]) => {
        const coin = tradingState.availableCoins.find(c => c.symbol === symbol);
        if (!coin) return '';
        
        const currentValue = position.amount * coin.price;
        const pnl = currentValue - position.cost;
        const pnlPercent = (pnl / position.cost) * 100;
        const trendEmoji = pnl > 0 ? '📈' : pnl < 0 ? '📉' : '➡️';
        
        return `
            <div class="market-item">
                <div class="coin-info">
                    <span class="coin-symbol">${symbol}</span>
                    <span class="coin-trend">${trendEmoji}</span>
                </div>
                <div class="coin-price">
                    <div>${position.amount.toLocaleString()} coins</div>
                    <div style="color: ${pnl >= 0 ? '#10b981' : '#ef4444'}; font-size: 0.9rem;">
                        ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function simulateMarketMove() {
    tradingState.availableCoins.forEach(coin => {
        const change = (Math.random() * 0.4 - 0.15);
        coin.price *= (1 + change);
        coin.price = Math.max(coin.price, 0.0000001);
    });
}

function saveTradingState() {
    localStorage.setItem('cypherx_trading_state', JSON.stringify(tradingState));
}

function loadTradingState() {
    const saved = localStorage.getItem('cypherx_trading_state');
    if (saved) {
        tradingState = { ...tradingState, ...JSON.parse(saved) };
    }
}

// UI Functions
function showSection(sectionId) {
    if (!walletState.connected && !['wallet-connect', 'connection-loading'].includes(sectionId)) {
        showSection('wallet-connect');
        return;
    }

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
}

function updateLoadingMessage(message) {
    const element = document.getElementById('loading-message');
    if (element) {
        element.textContent = message;
    }
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').classList.add('active');
    showSection('wallet-connect');
}

function showSuccessModal() {
    document.getElementById('success-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function updateSignal() {
    const signals = [
        "🔴 Twitter Trend Detected",
        "🔵 TikTok Viral Signal", 
        "🟢 Reddit Hype Building",
        "🟡 Influencer Mention",
        "🟣 Community Pump Signal",
        "⚫️ AI Pattern Recognition"
    ];
    const randomSignal = signals[Math.floor(Math.random() * signals.length)];
    
    const tradeSignal = document.getElementById('trade-signal');
    const currentSignal = document.getElementById('current-signal');
    
    if (tradeSignal) tradeSignal.textContent = randomSignal;
    if (currentSignal) currentSignal.textContent = randomSignal;
}

function generateRandomTrade() {
    if (!walletState.connected || tradingState.availableCoins.length === 0) return;
    
    const coin = tradingState.availableCoins[Math.floor(Math.random() * tradingState.availableCoins.length)];
    const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
    executeTrade(action, coin.symbol);
}

// Initialize trading when app starts
function initializeApp() {
    loadTradingState();
    setupTradingInterface();
    updateTradingUI();
    updateSignal();
    
    // Auto-update signals
    setInterval(updateSignal, 10000);
    
    // Auto-generate random trades occasionally
    setInterval(() => {
        if (walletState.connected && Math.random() < 0.2) {
            generateRandomTrade();
        }
    }, 15000);
}

// Listen for account changes (MetaMask)
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else if (walletState.connected && walletState.walletType === 'metamask') {
            // Reconnect with new account
            connectMetaMask();
        }
    });

    window.ethereum.on('chainChanged', (chainId) => {
        if (walletState.connected && walletState.walletType === 'metamask') {
            // Refresh connection on network change
            connectMetaMask();
        }
    });
}
