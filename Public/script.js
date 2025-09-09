
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set fixed canvas size instead of fullscreen
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Initialize DOM elements
        this.mainMenu = document.getElementById('mainMenu');
        this.multiplayerMenu = document.getElementById('multiplayerMenu');
        this.lobbyRoom = document.getElementById('lobbyRoom');
        this.countdownTimer = document.getElementById('countdownTimer');
        this.loadingScreen = document.getElementById('loadingScreen');
        
        console.log('DOM elements initialized:');
        console.log('Main menu:', this.mainMenu);
        console.log('Multiplayer menu:', this.multiplayerMenu);
        console.log('Lobby room:', this.lobbyRoom);
        
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.selectedCharacter = 0;
        this.player = new Player(this.width / 2, this.height - 50, this.selectedCharacter);
        this.bullets = [];
        this.enemyBullets = []; // New array for enemy bullets
        this.enemies = [];
        this.particles = [];
        this.stars = [];
        this.explosions = [];

        this.score = 0;
        this.lives = 4;
        this.playerLevel = 1;
        this.xp = 0;
        this.maxXp = 100;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameover', 'shop', 'ability-select'
        
        // Ability Selection System
        this.showingAbilitySelection = false;
        this.currentAbilityChoices = [];
        this.playerAbilities = {
            extraBullets: 0,        // Number of extra bullets per shot
            bulletPenetration: 0,   // Bullets can pierce through enemies
            shieldStrength: 0,      // Damage reduction shield
            rapidFire: 0,          // Fire rate multiplier
            homingBullets: 0,      // Bullets that track enemies
            explosiveBullets: 0,   // Bullets that explode on impact
            healthBoost: 0,        // Extra max health
            speedBoost: 0,         // Movement speed multiplier
            bulletDamage: 0,       // Extra bullet damage
            lifeSteal: 0,          // Heal on enemy kill
            criticalChance: 0,     // Chance for critical hits
            bulletSize: 0,         // Larger bullets
            magnetism: 0,          // Attract XP orbs
            berserker: 0,          // Damage increases when low health
            timeWarp: 0,           // Slow down time occasionally
            multiShot: 0           // Shoot in multiple directions
        };
        
        // Wave system
        this.currentWave = 1;
        this.enemiesInWave = 9;
        this.enemiesKilledInWave = 0;
        this.enemiesSpawnedInWave = 0;
        this.waveComplete = false;
        this.showingWaveText = false;
        this.waveTextTimer = 0;
        this.waveTextDuration = 2000;
        this.boss = null;
        this.isBossWave = false;
        this.bossDefeated = false;
        
        // Barrier system
        this.barrierY = this.height - 100;
        this.barrierHeight = 5;
        
        this.keys = {};
        this.lastEnemySpawn = 0;
        this.enemySpawnRate = 1500;
        this.baseEnemySpawnRate = 1500;
        
        // Game timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Player respawn system
        this.playerRespawning = false;
        this.respawnTimer = 0;
        this.respawnDuration = 2000;
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        this.invulnerabilityDuration = 3000;
        
        // Player stats and upgrades
        this.upgradePoints = 0;
        this.playerStats = {
            attack: 1,
            defense: 1,
            speed: 1,
            fireRate: 1,
            special: 0
        };
        
        // Multiplayer system
        this.multiplayerMode = false;
        this.socket = null;
        this.roomId = null;
        this.isHost = false;
        this.otherPlayers = new Map();
        this.playerReady = false;
        this.lobbyPlayers = [];
        this.gameSettings = {
            gameSpeed: 1,
            spawnRate: 1,
            powerupFreq: 1
        };
        
        // AI Assistant messages
        this.aiMessages = [
            "Welcome, pilot! I'll help you upgrade your ship.",
            "Destroy enemies to earn upgrade points!",
            "Upgrading your attack will increase damage.",
            "Defense upgrades reduce damage taken.",
            "Speed upgrades make your ship faster.",
            "Fire rate upgrades let you shoot more often.",
            "Special upgrades unlock unique abilities!",
            "Boss incoming! Prepare for battle!",
            "Great job! Keep up the good work!",
            "Try upgrading your weakest stat next."
        ];
        this.currentAiMessage = 0;
        this.aiMessageTimer = 0;
        this.aiMessageInterval = 5000;
        
        // User profile
        this.userProfile = {
            username: "Guest",
            loggedIn: false,
            provider: null,
            avatar: null
        };
        
        // Multiplayer setup
        this.socket = null;
        this.isMultiplayer = true;
        this.players = {};
        this.playerId = null;
        
        // XP orbs and pickups
        this.xpOrbs = [];
        this.healthPacks = [];
        
        this.initStars();
        this.setupEventListeners();
        this.initCharacterPreviews();
        this.showMenu();
        this.setupMultiplayer();
        this.loadGameData();
    }
    
    // Ability Selection System
    generateAbilityChoices() {
        const availableAbilities = [
            {
                id: 'extraBullets',
                name: 'Multi-Shot',
                description: 'Fire additional bullets with each shot',
                icon: '⚡',
                maxLevel: 5,
                rarity: 'common'
            },
            {
                id: 'bulletPenetration',
                name: 'Piercing Rounds',
                description: 'Bullets pierce through multiple enemies',
                icon: '🔻',
                maxLevel: 3,
                rarity: 'uncommon'
            },
            {
                id: 'shieldStrength',
                name: 'Energy Shield',
                description: 'Reduce incoming damage by 20% per level',
                icon: '🛡️',
                maxLevel: 4,
                rarity: 'common'
            },
            {
                id: 'rapidFire',
                name: 'Rapid Fire',
                description: 'Increase fire rate significantly',
                icon: '💥',
                maxLevel: 6,
                rarity: 'common'
            },
            {
                id: 'homingBullets',
                name: 'Homing Missiles',
                description: 'Bullets track nearest enemies',
                icon: '🎯',
                maxLevel: 3,
                rarity: 'rare'
            },
            {
                id: 'explosiveBullets',
                name: 'Explosive Rounds',
                description: 'Bullets explode on impact, dealing area damage',
                icon: '💣',
                maxLevel: 4,
                rarity: 'rare'
            },
            {
                id: 'healthBoost',
                name: 'Vitality Boost',
                description: 'Increase maximum health by 50 per level',
                icon: '❤️',
                maxLevel: 5,
                rarity: 'common'
            },
            {
                id: 'speedBoost',
                name: 'Afterburners',
                description: 'Increase movement speed by 25% per level',
                icon: '🚀',
                maxLevel: 4,
                rarity: 'common'
            },
            {
                id: 'bulletDamage',
                name: 'Power Core',
                description: 'Increase bullet damage by 40% per level',
                icon: '⚡',
                maxLevel: 5,
                rarity: 'uncommon'
            },
            {
                id: 'lifeSteal',
                name: 'Nano Repair',
                description: 'Heal 10 HP for each enemy destroyed',
                icon: '💉',
                maxLevel: 3,
                rarity: 'uncommon'
            },
            {
                id: 'criticalChance',
                name: 'Critical Strike',
                description: 'Chance for bullets to deal double damage',
                icon: '⭐',
                maxLevel: 4,
                rarity: 'rare'
            },
            {
                id: 'bulletSize',
                name: 'Heavy Rounds',
                description: 'Increase bullet size and damage',
                icon: '⚫',
                maxLevel: 3,
                rarity: 'uncommon'
            },
            {
                id: 'magnetism',
                name: 'Magnetic Field',
                description: 'Automatically collect XP and health from greater distance',
                icon: '🧲',
                maxLevel: 4,
                rarity: 'uncommon'
            },
            {
                id: 'berserker',
                name: 'Berserker Mode',
                description: 'Deal more damage when health is low',
                icon: '😡',
                maxLevel: 3,
                rarity: 'rare'
            },
            {
                id: 'timeWarp',
                name: 'Time Dilation',
                description: 'Occasionally slow down time for enemies',
                icon: '⏰',
                maxLevel: 2,
                rarity: 'legendary'
            },
            {
                id: 'multiShot',
                name: 'Spread Shot',
                description: 'Fire bullets in multiple directions',
                icon: '🎆',
                maxLevel: 4,
                rarity: 'rare'
            }
        ];

        // Filter out maxed abilities
        const filteredAbilities = availableAbilities.filter(ability => 
            this.playerAbilities[ability.id] < ability.maxLevel
        );

        if (filteredAbilities.length === 0) {
            return availableAbilities.slice(0, 3); // Fallback if all maxed
        }

        // Weighted random selection based on rarity
        const rarityWeights = {
            common: 50,
            uncommon: 25,
            rare: 15,
            legendary: 5
        };

        const choices = [];
        const usedAbilities = new Set();

        while (choices.length < 3 && choices.length < filteredAbilities.length) {
            let selectedAbility;
            let attempts = 0;
            
            do {
                const totalWeight = filteredAbilities.reduce((sum, ability) => 
                    sum + (rarityWeights[ability.rarity] || 10), 0);
                let random = Math.random() * totalWeight;
                
                for (const ability of filteredAbilities) {
                    random -= rarityWeights[ability.rarity] || 10;
                    if (random <= 0) {
                        selectedAbility = ability;
                        break;
                    }
                }
                attempts++;
            } while (usedAbilities.has(selectedAbility?.id) && attempts < 50);

            if (selectedAbility && !usedAbilities.has(selectedAbility.id)) {
                choices.push({
                    ...selectedAbility,
                    currentLevel: this.playerAbilities[selectedAbility.id]
                });
                usedAbilities.add(selectedAbility.id);
            }
        }

        return choices;
    }

    showAbilitySelection() {
        this.showingAbilitySelection = true;
        this.gameState = 'ability-select';
        this.gamePaused = true;
        this.currentAbilityChoices = this.generateAbilityChoices();
        
        // Create ability selection UI
        this.createAbilitySelectionUI();
    }

    createAbilitySelectionUI() {
        // Remove existing ability selection if any
        const existing = document.getElementById('abilitySelection');
        if (existing) {
            existing.remove();
        }

        const abilitySelection = document.createElement('div');
        abilitySelection.id = 'abilitySelection';
        abilitySelection.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 20, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            font-family: Arial, sans-serif;
        `;

        const title = document.createElement('h2');
        title.textContent = 'LEVEL UP! Choose an Ability';
        title.style.cssText = `
            color: #00ffff;
            font-size: 2.5em;
            margin-bottom: 30px;
            text-shadow: 0 0 20px #00ffff;
            animation: pulse 2s ease-in-out infinite alternate;
        `;

        const choicesContainer = document.createElement('div');
        choicesContainer.style.cssText = `
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
            justify-content: center;
            max-width: 800px;
        `;

        this.currentAbilityChoices.forEach((ability, index) => {
            const abilityCard = document.createElement('div');
            abilityCard.className = 'ability-card';
            abilityCard.style.cssText = `
                background: linear-gradient(145deg, #1a1a2e, #16213e);
                border: 2px solid ${this.getRarityColor(ability.rarity)};
                border-radius: 15px;
                padding: 20px;
                width: 220px;
                height: 280px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            `;

            const icon = document.createElement('div');
            icon.style.cssText = `
                font-size: 3em;
                margin-bottom: 10px;
            `;
            icon.textContent = ability.icon;

            const name = document.createElement('h3');
            name.textContent = ability.name;
            name.style.cssText = `
                color: ${this.getRarityColor(ability.rarity)};
                margin: 10px 0;
                font-size: 1.3em;
            `;

            const description = document.createElement('p');
            description.textContent = ability.description;
            description.style.cssText = `
                color: #ccc;
                font-size: 0.9em;
                line-height: 1.4;
                margin: 10px 0;
                flex-grow: 1;
            `;

            const levelInfo = document.createElement('div');
            levelInfo.style.cssText = `
                color: #999;
                font-size: 0.8em;
                margin-top: auto;
            `;
            levelInfo.textContent = `Level ${ability.currentLevel + 1}/${ability.maxLevel}`;

            const rarityBadge = document.createElement('div');
            rarityBadge.textContent = ability.rarity.toUpperCase();
            rarityBadge.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: ${this.getRarityColor(ability.rarity)};
                color: black;
                padding: 2px 6px;
                font-size: 0.7em;
                border-radius: 3px;
                font-weight: bold;
            `;
            abilityCard.style.position = 'relative';

            abilityCard.appendChild(rarityBadge);
            abilityCard.appendChild(icon);
            abilityCard.appendChild(name);
            abilityCard.appendChild(description);
            abilityCard.appendChild(levelInfo);

            // Hover effects
            abilityCard.addEventListener('mouseenter', () => {
                abilityCard.style.transform = 'translateY(-10px) scale(1.05)';
                abilityCard.style.boxShadow = `0 10px 25px rgba(0, 0, 0, 0.8), 0 0 20px ${this.getRarityColor(ability.rarity)}`;
            });

            abilityCard.addEventListener('mouseleave', () => {
                abilityCard.style.transform = 'translateY(0) scale(1)';
                abilityCard.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.5)';
            });

            // Click handler
            abilityCard.addEventListener('click', () => {
                this.selectAbility(ability);
            });

            // Keyboard selection
            const keyIndicator = document.createElement('div');
            keyIndicator.textContent = `Press ${index + 1}`;
            keyIndicator.style.cssText = `
                position: absolute;
                bottom: 5px;
                left: 5px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 2px 6px;
                font-size: 0.7em;
                border-radius: 3px;
            `;
            abilityCard.appendChild(keyIndicator);

            choicesContainer.appendChild(abilityCard);
        });

        const instruction = document.createElement('p');
        instruction.textContent = 'Click an ability or press 1-3 to select';
        instruction.style.cssText = `
            color: #888;
            margin-top: 30px;
            font-size: 1.1em;
        `;

        abilitySelection.appendChild(title);
        abilitySelection.appendChild(choicesContainer);
        abilitySelection.appendChild(instruction);

        document.body.appendChild(abilitySelection);

        // Add keyboard event listener for ability selection
        const handleKeyPress = (e) => {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 3 && this.currentAbilityChoices[num - 1]) {
                this.selectAbility(this.currentAbilityChoices[num - 1]);
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    }

    getRarityColor(rarity) {
        switch (rarity) {
            case 'common': return '#888888';
            case 'uncommon': return '#00ff00';
            case 'rare': return '#0088ff';
            case 'legendary': return '#ff8800';
            default: return '#888888';
        }
    }

    selectAbility(ability) {
        // Apply the ability upgrade
        this.playerAbilities[ability.id]++;
        
        // Apply immediate effects based on ability type
        this.applyAbilityEffect(ability.id);
        
        // Hide ability selection
        this.hideAbilitySelection();
        
        // Resume game
        this.showingAbilitySelection = false;
        this.gameState = 'playing';
        this.gamePaused = false;
        this.lastTime = 0; // Reset timing
        
        // Show feedback message
        this.setAiMessage(`${ability.name} upgraded! Level ${this.playerAbilities[ability.id]}`);
    }

    applyAbilityEffect(abilityId) {
        switch (abilityId) {
            case 'healthBoost':
                this.player.maxHealth += 50;
                this.player.health = this.player.maxHealth; // Full heal
                break;
            case 'speedBoost':
                this.player.speed *= 1.25;
                break;
            case 'bulletDamage':
                this.player.bulletDamage *= 1.4;
                break;
            case 'rapidFire':
                this.player.shotCooldown *= 0.8;
                break;
            case 'shieldStrength':
                this.player.defense += 5;
                break;
            // Other abilities are applied during gameplay
        }
    }

    hideAbilitySelection() {
        const abilitySelection = document.getElementById('abilitySelection');
        if (abilitySelection) {
            abilitySelection.remove();
        }
    }
    
    initStars() {
        this.stars = [];
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2,
                speed: Math.random() * 2 + 1,
                opacity: Math.random()
            });
        }
    }
    
    setupEventListeners() {
        // Game controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === ' ' && this.gameState === 'playing' && !this.playerRespawning) {
                e.preventDefault();
                this.player.shoot(this.bullets, this.playerAbilities);
                if (this.isMultiplayer && this.socket) {
                    this.socket.emit('shoot', { x: this.player.x, y: this.player.y });
                }
            }
            
            if (e.key === 'Escape') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse controls for shooting
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.gameState === 'playing' && !this.playerRespawning) {
                this.player.shoot(this.bullets, this.playerAbilities);
                if (this.isMultiplayer && this.socket) {
                    this.socket.emit('shoot', { x: this.player.x, y: this.player.y });
                }
            }
        });
        
        // Menu buttons
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        const characterBtn = document.getElementById('characterBtn');
        if (characterBtn) {
            characterBtn.addEventListener('click', () => {
                this.showCharacterShop();
            });
        }
        
        const instructionsBtn = document.getElementById('instructionsBtn');
        if (instructionsBtn) {
            instructionsBtn.addEventListener('click', () => {
                this.showInstructions();
            });
        }
        
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.hideInstructions();
            });
        }
        
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.showMenu();
            });
        }
        
        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.resumeGame();
            });
        }
        
        const pauseMenuBtn = document.getElementById('pauseMenuBtn');
        if (pauseMenuBtn) {
            pauseMenuBtn.addEventListener('click', () => {
                this.showMenu();
            });
        }
        
        // Character shop buttons
        const selectCharacterBtn = document.getElementById('selectCharacterBtn');
        if (selectCharacterBtn) {
            selectCharacterBtn.addEventListener('click', () => {
                this.selectCharacter();
            });
        }
        
        const closeShopBtn = document.getElementById('closeShopBtn');
        if (closeShopBtn) {
            closeShopBtn.addEventListener('click', () => {
                this.hideCharacterShop();
            });
        }
        
        // Character selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.character-card')) {
                const card = e.target.closest('.character-card');
                const characterId = parseInt(card.dataset.character);
                if (!isNaN(characterId)) {
                    this.selectCharacterCard(characterId);
                }
            }
        });
        
        // Character shop scroll
        const characterGrid = document.querySelector('.character-grid');
        if (characterGrid) {
            characterGrid.addEventListener('wheel', (e) => {
                e.preventDefault();
                const scrollWrapper = document.querySelector('.character-scroll-wrapper');
                if (scrollWrapper) {
                    scrollWrapper.scrollTop += e.deltaY;
                }
            });
        }
        
        // Login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showLoginModal();
            });
        }
        
        // Close login modal
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideLoginModal();
            });
        }
        
        // Login provider buttons
        const providerBtns = document.querySelectorAll('.provider-btn');
        providerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const provider = e.currentTarget.classList[1].split('-')[0]; // google-btn -> google
                this.loginWithProvider(provider);
            });
        });
        
        // Upgrade buttons
        const upgradeBtns = document.querySelectorAll('.upgrade-btn');
        upgradeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stat = e.currentTarget.dataset.stat;
                this.upgradeStat(stat);
            });
        });
        
        // Login modal click outside to close
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    this.hideLoginModal();
                }
            });
        }
        
        // Multiplayer button
        const multiplayerBtn = document.getElementById('multiplayerBtn');
        if (multiplayerBtn) {
            console.log('Multiplayer button found, adding event listener');
            multiplayerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Multiplayer button clicked!');
                this.showMultiplayerMenu();
            });
            
            // Add a test click handler for debugging
            multiplayerBtn.addEventListener('mousedown', () => {
                console.log('Multiplayer button mousedown detected');
            });
        } else {
            console.error('Multiplayer button not found!');
        }
        
        // Multiplayer menu buttons
        const closeMultiplayerBtn = document.getElementById('closeMultiplayerBtn');
        if (closeMultiplayerBtn) {
            closeMultiplayerBtn.addEventListener('click', () => {
                this.hideMultiplayerMenu();
            });
        }
        
        const refreshLobbiesBtn = document.getElementById('refreshLobbiesBtn');
        if (refreshLobbiesBtn) {
            refreshLobbiesBtn.addEventListener('click', () => {
                this.refreshLobbies();
            });
        }
        
        const createLobbyBtn = document.getElementById('createLobbyBtn');
        if (createLobbyBtn) {
            createLobbyBtn.addEventListener('click', () => {
                this.createLobby();
            });
        }
        
        // Lobby room buttons
        const readyBtn = document.getElementById('readyBtn');
        if (readyBtn) {
            readyBtn.addEventListener('click', () => {
                this.toggleReady();
            });
        }
        
        const leaveLobbyBtn = document.getElementById('leaveLobbyBtn');
        if (leaveLobbyBtn) {
            leaveLobbyBtn.addEventListener('click', () => {
                this.leaveLobby();
            });
        }
        
        // Chat input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
        
        const sendChatBtn = document.getElementById('sendChatBtn');
        if (sendChatBtn) {
            sendChatBtn.addEventListener('click', () => {
                this.sendChatMessage();
            });
        }
        
        // Admin settings
        const gameSpeedSlider = document.getElementById('gameSpeed');
        const spawnRateSlider = document.getElementById('spawnRate');
        const powerupFreqSlider = document.getElementById('powerupFreq');
        
        if (gameSpeedSlider) {
            gameSpeedSlider.addEventListener('input', () => {
                this.updateGameSettings();
            });
        }
        
        if (spawnRateSlider) {
            spawnRateSlider.addEventListener('input', () => {
                this.updateGameSettings();
            });
        }
        
        if (powerupFreqSlider) {
            powerupFreqSlider.addEventListener('input', () => {
                this.updateGameSettings();
            });
        }
        
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Kick buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('kick-btn')) {
                const playerSlot = e.target.closest('.player-slot');
                const playerId = this.lobbyPlayers[parseInt(playerSlot.dataset.slot)]?.id;
                if (playerId) {
                    this.kickPlayer(playerId);
                }
            }
        });
    }
    
    switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }
    
    update(currentTime) {
        if (!this.gameRunning || this.gamePaused) return;
        
        // Calculate delta time for consistent game speed
        if (this.lastTime === 0) this.lastTime = currentTime;
        this.deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        
        // Update wave text timer
        if (this.showingWaveText) {
            this.waveTextTimer -= this.deltaTime;
            if (this.waveTextTimer <= 0) {
                this.showingWaveText = false;
            }
        }
        
        // Update AI message timer
        this.aiMessageTimer += this.deltaTime;
        if (this.aiMessageTimer >= this.aiMessageInterval) {
            this.updateAiMessage();
            this.aiMessageTimer = 0;
        }
        
        // Update player respawn system
        if (this.playerRespawning) {
            this.respawnTimer -= this.deltaTime;
            if (this.respawnTimer <= 0) {
                this.respawnPlayer();
            }
        } else {
            // Update player with stat modifiers
            this.player.update(this.keys, this.width, this.height, this.deltaTime, this.playerStats, this.playerAbilities);
        }
        
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerabilityTimer -= this.deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Update player bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(this.deltaTime, this.enemies, this.playerAbilities);
            return bullet.y > -10 && !bullet.destroyed;
        });
        
        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.update(this.deltaTime);
            return bullet.y < this.height + 10;
        });
        
        // Update XP orbs and health packs
        this.updatePickups();
        
        // Wave system logic
        this.updateWaveSystem();
        
        // Update enemies and check barrier collision
        this.enemies = this.enemies.filter(enemy => {
            enemy.update(this.deltaTime);
            
            // Enemy shooting logic
            if (enemy.level >= 3 && Math.random() < 0.005 * (enemy.level / 3)) {
                this.createEnemyBullet(enemy.x + enemy.width/2, enemy.y + enemy.height, 5, 10 + enemy.level * 2);
            }
            
            // Check if enemy passes barrier
            if (enemy.y + enemy.height >= this.barrierY) {
                this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 'enemy');
                this.enemiesKilledInWave++;
                return false;
            }
            
            return enemy.y < this.height + 50;
        });
        
        // Update boss
        if (this.boss) {
            this.boss.update(this.deltaTime);
            
            // Boss shooting logic
            if (Date.now() - this.boss.lastShot > this.boss.shotCooldown) {
                // Center bullet
                this.createEnemyBullet(this.boss.x + this.boss.width/2, this.boss.y + this.boss.height, 6, this.boss.bulletDamage);
                
                // Side bullets for higher waves
                if (this.currentWave >= 20) {
                    this.createEnemyBullet(this.boss.x + 20, this.boss.y + this.boss.height, 5, this.boss.bulletDamage * 0.8);
                    this.createEnemyBullet(this.boss.x + this.boss.width - 20, this.boss.y + this.boss.height, 5, this.boss.bulletDamage * 0.8);
                }
                
                // Spread bullets for even higher waves
                if (this.currentWave >= 30) {
                    this.createEnemyBullet(this.boss.x + this.boss.width/2 - 30, this.boss.y + this.boss.height, 5, this.boss.bulletDamage * 0.7, -1);
                    this.createEnemyBullet(this.boss.x + this.boss.width/2 + 30, this.boss.y + this.boss.height, 5, this.boss.bulletDamage * 0.7, 1);
                }
                
                this.boss.lastShot = Date.now();
            }
            
            if (this.boss.y > this.height + 100) {
                this.boss = null;
                this.isBossWave = false;
            }
        }
        
        // Update particles and explosions
        this.particles = this.particles.filter(particle => {
            particle.update(this.deltaTime);
            return particle.life > 0;
        });
        
        this.explosions = this.explosions.filter(explosion => {
            explosion.update(this.deltaTime);
            return !explosion.finished;
        });
        
        // Update stars
        this.stars.forEach(star => {
            star.y += star.speed * (this.deltaTime / 16);
            if (star.y > this.height) {
                star.y = -5;
                star.x = Math.random() * this.width;
            }
        });
        
        this.checkCollisions();
        this.updateHUD();
        this.updateStatsPanel();
    }
    
    updatePickups() {
        // Update XP orbs
        this.xpOrbs = this.xpOrbs.filter(orb => {
            orb.update(this.deltaTime);
            
            // Magnetism ability
            if (this.playerAbilities.magnetism > 0) {
                const magnetRange = 100 + (this.playerAbilities.magnetism * 50);
                const dx = this.player.x + this.player.width/2 - orb.x;
                const dy = this.player.y + this.player.height/2 - orb.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < magnetRange) {
                    const pullStrength = 0.3 + (this.playerAbilities.magnetism * 0.1);
                    orb.vx += dx * pullStrength / distance;
                    orb.vy += dy * pullStrength / distance;
                }
            }
            
            // Check collection
            if (this.isColliding(orb, this.player)) {
                this.gainXP(orb.value);
                return false;
            }
            
            return orb.life > 0;
        });
        
        // Update health packs
        this.healthPacks = this.healthPacks.filter(pack => {
            pack.update(this.deltaTime);
            
            // Check collection
            if (this.isColliding(pack, this.player)) {
                this.player.heal(pack.healAmount);
                this.createHealEffect(this.player.x, this.player.y);
                return false;
            }
            
            return pack.life > 0;
        });
    }
    
    createXPOrb(x, y, value = 10) {
        this.xpOrbs.push(new XPOrb(x, y, value));
    }
    
    createHealthPack(x, y, healAmount = 25) {
        this.healthPacks.push(new HealthPack(x, y, healAmount));
    }
    
    createHealEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new HealParticle(x, y));
        }
    }
    
    createEnemyBullet(x, y, speed, damage, angleOffset = 0) {
        const bullet = new EnemyBullet(x, y, speed, damage);
        
        // Add angle offset for spread shots
        if (angleOffset !== 0) {
            const angle = angleOffset * 0.3; // Convert to radians
            bullet.vx = Math.sin(angle) * speed;
        }
        
        this.enemyBullets.push(bullet);
    }
    
    updateWaveSystem() {
        // Check if wave is complete
        if (!this.waveComplete && !this.showingWaveText) {
            if (this.isBossWave) {
                if (this.bossDefeated && !this.boss) {
                    this.completeWave();
                }
            } else {
                if (this.enemiesSpawnedInWave >= this.enemiesInWave && 
                    this.enemiesKilledInWave >= this.enemiesInWave && 
                    this.enemies.length === 0) {
                    this.completeWave();
                }
            }
        }
        
        // Spawn enemies for current wave
        if (!this.waveComplete && !this.showingWaveText) {
            this.spawnWaveEnemies();
        }
    }
    
    spawnWaveEnemies() {
        const currentTime = Date.now();
        
        if (this.isBossWave && !this.boss && !this.bossDefeated) {
            // Create boss with health scaling based on wave number
            const bossHealthMultiplier = 1 + (this.currentWave / 10);
            this.boss = new Boss(this.width / 2 - 50, -100, this.currentWave, bossHealthMultiplier);
            this.enemiesSpawnedInWave = 1;
            
            // Update AI message for boss wave
            this.setAiMessage("Boss incoming! Prepare for battle!");
            return;
        }
        
        if (!this.isBossWave && currentTime - this.lastEnemySpawn > this.enemySpawnRate) {
            if (this.enemiesSpawnedInWave < this.enemiesInWave) {
                const enemyLevel = Math.min(Math.floor(this.currentWave / 3) + 1, 10);
                this.enemies.push(new Enemy(Math.random() * (this.width - 40), -40, enemyLevel));
                this.enemiesSpawnedInWave++;
                this.lastEnemySpawn = currentTime;
            }
        }
    }
    
    getEnemiesPerWave() {
        if (this.currentWave % 10 === 0) return 1;
        if (this.currentWave <= 3) return 3;
        if (this.currentWave <= 6) return 5;
        if (this.currentWave <= 9) return 7;
        return Math.min(10, 3 + Math.floor(this.currentWave / 3));
    }
    
    startWave() {
        this.waveComplete = false;
        this.enemiesKilledInWave = 0;
        this.enemiesSpawnedInWave = 0;
        this.bossDefeated = false;
        this.isBossWave = (this.currentWave % 10 === 0);
        
        this.enemiesInWave = this.getEnemiesPerWave();
        
        this.showingWaveText = true;
        this.waveTextTimer = this.waveTextDuration;
        
        this.enemySpawnRate = Math.max(800, this.baseEnemySpawnRate - (this.currentWave * 50));
        
        // Update AI message for new wave
        if (this.isBossWave) {
            this.setAiMessage("Boss wave incoming! Get ready for a tough fight!");
        } else {
            this.setAiMessage(`Wave ${this.currentWave} starting! Destroy all enemies!`);
        }
        
        console.log(`Starting Wave ${this.currentWave}, Enemies: ${this.enemiesInWave}, Boss: ${this.isBossWave}`);
    }
    
    completeWave() {
        if (this.waveComplete) return;
        
        this.waveComplete = true;
        this.showingWaveText = true;
        this.waveTextTimer = this.waveTextDuration;
        
        let bonusXP = 50 + (this.currentWave * 10);
        let upgradePointsGained = 1;
        
        if (this.isBossWave) {
            bonusXP = 200 + (this.currentWave * 20);
            upgradePointsGained = 3;
            this.setAiMessage(`Boss defeated! You earned ${upgradePointsGained} upgrade points!`);
        } else {
            this.setAiMessage(`Wave completed! You earned ${upgradePointsGained} upgrade point!`);
        }
        
        this.gainXP(bonusXP);
        this.upgradePoints += upgradePointsGained;
        
        console.log(`Wave ${this.currentWave} completed! Moving to wave ${this.currentWave + 1}`);
        
        this.currentWave++;
        
        setTimeout(() => {
            this.startWave();
        }, this.waveTextDuration + 500);
    }
    
    checkCollisions() {
        // Player bullets vs Enemy collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.bullets[i] && this.enemies[j] && 
                    this.isColliding(this.bullets[i], this.enemies[j])) {
                    
                    const enemy = this.enemies[j];
                    let bulletDamage = this.bullets[i].damage * (1 + (this.playerStats.attack - 1) * 0.2);
                    
                    // Apply ability modifiers
                    if (this.playerAbilities.bulletDamage > 0) {
                        bulletDamage *= (1 + this.playerAbilities.bulletDamage * 0.4);
                    }
                    
                    // Critical hit chance
                    if (this.playerAbilities.criticalChance > 0) {
                        const critChance = this.playerAbilities.criticalChance * 0.15;
                        if (Math.random() < critChance) {
                            bulletDamage *= 2;
                            this.createCriticalEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                        }
                    }
                    
                    // Berserker mode
                    if (this.playerAbilities.berserker > 0) {
                        const healthPercent = this.player.health / this.player.maxHealth;
                        if (healthPercent < 0.5) {
                            const berserkerBonus = 1 + (this.playerAbilities.berserker * 0.3 * (1 - healthPercent));
                            bulletDamage *= berserkerBonus;
                        }
                    }
                    
                    enemy.takeDamage(bulletDamage);
                    
                    this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 'bullet');
                    
                    // Handle bullet penetration
                    if (this.playerAbilities.bulletPenetration === 0 || !this.bullets[i].piercing) {
                        this.bullets.splice(i, 1);
                    } else {
                        this.bullets[i].penetrationsLeft--;
                        if (this.bullets[i].penetrationsLeft <= 0) {
                            this.bullets.splice(i, 1);
                        }
                    }
                    
                    if (enemy.health <= 0) {
                        this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 'enemy');
                        
                        // Explosive bullets
                        if (this.playerAbilities.explosiveBullets > 0) {
                            this.createExplosiveBulletEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                        }
                        
                        // Drop XP orbs and occasional health packs
                        this.createXPOrb(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.xpReward);
                        if (Math.random() < 0.1) {
                            this.createHealthPack(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                        }
                        
                        this.enemies.splice(j, 1);
                        this.score += 100 * enemy.level;
                        this.gainXP(enemy.xpReward);
                        this.enemiesKilledInWave++;
                        
                        // Life steal ability
                        if (this.playerAbilities.lifeSteal > 0) {
                            const healAmount = this.playerAbilities.lifeSteal * 10;
                            this.player.heal(healAmount);
                            this.createHealEffect(this.player.x, this.player.y);
                        }
                        
                        // Random chance to get upgrade point from enemies
                        if (Math.random() < 0.05 * enemy.level / 3) {
                            this.upgradePoints += 1;
                            this.setAiMessage("You found an upgrade point!");
                        }
                    }
                    
                    if (this.isMultiplayer && this.socket) {
                        this.socket.emit('enemyDestroyed', { 
                            score: this.score, 
                            xp: this.xp, 
                            level: this.playerLevel 
                        });
                    }
                    break;
                }
            }
            
            // Player bullets vs Boss collisions
            if (this.boss && this.bullets[i] && this.isColliding(this.bullets[i], this.boss)) {
                let bulletDamage = this.bullets[i].damage * (1 + (this.playerStats.attack - 1) * 0.2);
                
                // Apply ability modifiers (same as enemy collisions)
                if (this.playerAbilities.bulletDamage > 0) {
                    bulletDamage *= (1 + this.playerAbilities.bulletDamage * 0.4);
                }
                
                if (this.playerAbilities.criticalChance > 0) {
                    const critChance = this.playerAbilities.criticalChance * 0.15;
                    if (Math.random() < critChance) {
                        bulletDamage *= 2;
                        this.createCriticalEffect(this.boss.x + this.boss.width/2, this.boss.y + this.boss.height/2);
                    }
                }
                
                if (this.playerAbilities.berserker > 0) {
                    const healthPercent = this.player.health / this.player.maxHealth;
                    if (healthPercent < 0.5) {
                        const berserkerBonus = 1 + (this.playerAbilities.berserker * 0.3 * (1 - healthPercent));
                        bulletDamage *= berserkerBonus;
                    }
                }
                
                this.boss.takeDamage(bulletDamage);
                this.createExplosion(this.bullets[i].x, this.bullets[i].y, 'bullet');
                
                // Handle bullet penetration for boss
                if (this.playerAbilities.bulletPenetration === 0 || !this.bullets[i].piercing) {
                    this.bullets.splice(i, 1);
                }
                
                if (this.boss.health <= 0 && !this.bossDefeated) {
                    this.createExplosion(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 'boss');
                    
                    // Boss drops multiple XP orbs and health packs
                    for (let k = 0; k < 5; k++) {
                        this.createXPOrb(
                            this.boss.x + Math.random() * this.boss.width, 
                            this.boss.y + Math.random() * this.boss.height, 
                            100
                        );
                    }
                    this.createHealthPack(this.boss.x + this.boss.width/2, this.boss.y + this.boss.height/2, 50);
                    
                    this.score += 5000 * Math.ceil(this.currentWave / 10);
                    this.gainXP(500 + this.currentWave * 20);
                    this.bossDefeated = true;
                    this.enemiesKilledInWave = 1;
                    
                    // Life steal from boss
                    if (this.playerAbilities.lifeSteal > 0) {
                        const healAmount = this.playerAbilities.lifeSteal * 25;
                        this.player.heal(healAmount);
                        this.createHealEffect(this.player.x, this.player.y);
                    }
                    
                    setTimeout(() => {
                        this.boss = null;
                    }, 1000);
                }
            }
        }
        
        // Enemy bullets vs Player collisions
        if (!this.invulnerable && !this.playerRespawning) {
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                if (this.isColliding(this.enemyBullets[i], this.player)) {
                    let damage = Math.max(1, this.enemyBullets[i].damage / (1 + (this.playerStats.defense - 1) * 0.2));
                    
                    // Apply shield ability
                    if (this.playerAbilities.shieldStrength > 0) {
                        damage *= (1 - this.playerAbilities.shieldStrength * 0.15);
                    }
                    
                    this.createExplosion(this.enemyBullets[i].x, this.enemyBullets[i].y, 'enemy');
                    this.enemyBullets.splice(i, 1);
                    
                    this.player.takeDamage(damage);
                    
                    if (this.player.health <= 0) {
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameOver();
                        } else {
                            this.startPlayerRespawn();
                        }
                    } else {
                        // Flash player instead of respawning for bullet hits
                        this.invulnerable = true;
                        this.invulnerabilityTimer = 1000;
                    }
                }
            }
        }
        
        // Player vs Enemy collisions (only if not invulnerable)
        if (!this.invulnerable && !this.playerRespawning) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                if (this.isColliding(this.player, this.enemies[i])) {
                    let damage = Math.max(1, this.enemies[i].damage / (1 + (this.playerStats.defense - 1) * 0.2));
                    
                    // Apply shield ability
                    if (this.playerAbilities.shieldStrength > 0) {
                        damage *= (1 - this.playerAbilities.shieldStrength * 0.15);
                    }
                    
                    this.createExplosion(this.enemies[i].x + this.enemies[i].width/2, this.enemies[i].y + this.enemies[i].height/2, 'enemy');
                    this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 'player');
                    this.enemies.splice(i, 1);
                    this.enemiesKilledInWave++;
                    
                    this.player.takeDamage(damage);
                    
                    if (this.player.health <= 0) {
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameOver();
                        } else {
                            this.startPlayerRespawn();
                        }
                    } else {
                        this.startPlayerRespawn();
                    }
                }
            }
            
            // Player vs Boss collisions
            if (this.boss && this.isColliding(this.player, this.boss)) {
                let damage = Math.max(1, this.boss.damage / (1 + (this.playerStats.defense - 1) * 0.2));
                
                // Apply shield ability
                if (this.playerAbilities.shieldStrength > 0) {
                    damage *= (1 - this.playerAbilities.shieldStrength * 0.15);
                }
                
                this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 'player');
                
                this.player.takeDamage(damage);
                
                if (this.player.health <= 0) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver();
                    } else {
                        this.startPlayerRespawn();
                    }
                } else {
                    this.startPlayerRespawn();
                }
            }
        }
    }
    
    createCriticalEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new CriticalParticle(x, y));
        }
    }
    
    createExplosiveBulletEffect(x, y) {
        // Create a larger explosion effect
        this.createExplosion(x, y, 'explosive');
        
        // Damage nearby enemies
        const explosionRadius = 60 + (this.playerAbilities.explosiveBullets * 20);
        const explosionDamage = 30 + (this.playerAbilities.explosiveBullets * 15);
        
        this.enemies.forEach((enemy, index) => {
            const dx = enemy.x + enemy.width/2 - x;
            const dy = enemy.y + enemy.height/2 - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= explosionRadius) {
                enemy.takeDamage(explosionDamage);
                if (enemy.health <= 0) {
                    this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 'enemy');
                    this.createXPOrb(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.xpReward);
                    this.enemies.splice(index, 1);
                    this.score += 100 * enemy.level;
                    this.enemiesKilledInWave++;
                }
            }
        });
    }
    
    startPlayerRespawn() {
        this.playerRespawning = true;
        this.respawnTimer = this.respawnDuration;
        this.player.x = this.width / 2 - this.player.width / 2;
        this.player.y = this.height + 100; // Move player off screen
    }
    
    respawnPlayer() {
        this.playerRespawning = false;
        this.invulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityDuration;
        this.player.x = this.width / 2 - this.player.width / 2;
        this.player.y = this.height - 50;
        this.player.health = this.player.maxHealth; // Full heal on respawn
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    createExplosion(x, y, type = 'default') {
        // Create explosion animation
        this.explosions.push(new Explosion(x, y, type));
        
        // Create particles
        const particleCount = type === 'boss' ? 30 : type === 'player' ? 25 : type === 'explosive' ? 40 : 15;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(x, y, type));
        }
    }
    
    render() {
        // Clear canvas with space background
        this.ctx.fillStyle = 'rgba(0, 1, 17, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        
        // Draw barrier
        this.drawBarrier();
        
        // Draw game objects only if game is running
        if (this.gameRunning) {
            // Draw XP orbs and health packs
            this.xpOrbs.forEach(orb => orb.draw(this.ctx));
            this.healthPacks.forEach(pack => pack.draw(this.ctx));
            
            // Draw player with invulnerability effect
            if (!this.playerRespawning) {
                if (this.invulnerable) {
                    this.ctx.save();
                    this.ctx.globalAlpha = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                    this.player.draw(this.ctx);
                    this.ctx.restore();
                } else {
                    this.player.draw(this.ctx);
                }
                
                // Draw shield effect if player has shield ability
                if (this.playerAbilities.shieldStrength > 0) {
                    this.drawShieldEffect();
                }
            }
            
            // Draw player bullets
            this.bullets.forEach(bullet => bullet.draw(this.ctx));
            
            // Draw enemy bullets
            this.enemyBullets.forEach(bullet => bullet.draw(this.ctx));
            
            // Draw enemies
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
            
            // Draw particles and explosions
            this.particles.forEach(particle => particle.draw(this.ctx));
            this.explosions.forEach(explosion => explosion.draw(this.ctx));
            
            // Draw boss
            if (this.boss) {
                this.boss.draw(this.ctx);
            }
            
            // Draw wave text
            if (this.showingWaveText) {
                this.drawWaveText();
            }
            
            // Draw respawn timer
            if (this.playerRespawning) {
                this.drawRespawnTimer();
            }
            
            // Draw other players in multiplayer
            if (this.multiplayerMode && this.otherPlayers.size > 0) {
                this.otherPlayers.forEach((player, playerId) => {
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.8;
                    
                    // Create a temporary player object for rendering
                    const otherPlayer = new Player(player.position.x, player.position.y, 0);
                    otherPlayer.draw(this.ctx);
                    
                    // Draw player name above ship
                    this.ctx.fillStyle = '#00ffff';
                    this.ctx.font = '12px Orbitron';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(player.username, player.position.x + 15, player.position.y - 10);
                    
                    // Draw player score
                    this.ctx.fillStyle = '#ffff00';
                    this.ctx.font = '10px Orbitron';
                    this.ctx.fillText(`Score: ${player.score}`, player.position.x + 15, player.position.y - 25);
                    
                    this.ctx.restore();
                });
            }
        }
    }
    
    drawShieldEffect() {
        if (!this.player || this.playerRespawning) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2 + this.playerAbilities.shieldStrength;
        this.ctx.globalAlpha = 0.6;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        
        const radius = 25 + this.playerAbilities.shieldStrength * 5;
        this.ctx.beginPath();
        this.ctx.arc(
            this.player.x + this.player.width/2, 
            this.player.y + this.player.height/2, 
            radius, 
            0, 
            Math.PI * 2
        );
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawBarrier() {
        // Draw barrier line
        this.ctx.save();
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = this.barrierHeight;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.barrierY);
        this.ctx.lineTo(this.width, this.barrierY);
        this.ctx.stroke();
        
        // Draw barrier energy effect
        const time = Date.now() * 0.005;
        for (let x = 0; x < this.width; x += 20) {
            const intensity = Math.sin(time + x * 0.01) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgba(0, 255, 255, ${intensity * 0.3})`;
            this.ctx.fillRect(x, this.barrierY - 2, 10, this.barrierHeight + 4);
        }
        
        this.ctx.restore();
    }
    
    drawWaveText() {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold 48px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 10;
        
        let text = '';
        if (this.waveComplete) {
            text = `WAVE ${this.currentWave - 1} COMPLETED!`;
        } else if (this.isBossWave) {
            text = `BOSS WAVE ${this.currentWave}!`;
        } else {
            text = `WAVE ${this.currentWave}`;
        }
        
        this.ctx.fillText(text, this.width / 2, this.height / 2);
        this.ctx.restore();
    }
    
    drawRespawnTimer() {
        const timeLeft = Math.ceil(this.respawnTimer / 1000);
        this.ctx.save();
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = `bold 36px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 5;
        this.ctx.fillText(`RESPAWNING IN ${timeLeft}`, this.width / 2, this.height / 2 + 50);
        this.ctx.restore();
    }
    
    // Menu and UI methods
    showMenu() {
        this.gameState = 'menu';
        this.gameRunning = false;
        this.gamePaused = false;
        
        const mainMenu = document.getElementById('mainMenu');
        const gameHUD = document.getElementById('gameHUD');
        const gameCanvas = document.getElementById('gameCanvas');
        const gameOver = document.getElementById('gameOver');
        const pauseScreen = document.getElementById('pauseScreen');
        const characterShop = document.getElementById('characterShop');
        const gameStatsPanel = document.getElementById('gameStatsPanel');
        const userProfile = document.getElementById('userProfile');
        const loginModal = document.getElementById('loginModal');
        
        if (mainMenu) mainMenu.style.display = 'flex';
        if (gameHUD) gameHUD.style.display = 'none';
        if (gameCanvas) gameCanvas.style.display = 'none';
        if (gameOver) gameOver.style.display = 'none';
        if (pauseScreen) pauseScreen.style.display = 'none';
        if (characterShop) characterShop.style.display = 'none';
        if (gameStatsPanel) gameStatsPanel.style.display = 'none';
        if (userProfile) userProfile.style.display = 'flex';
        if (loginModal) loginModal.style.display = 'none';
        
        this.hideInstructions();
        this.hideAbilitySelection();
        this.saveGameData();
        this.resetGame();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameRunning = true;
        this.gamePaused = false;
        
        const mainMenu = document.getElementById('mainMenu');
        const gameHUD = document.getElementById('gameHUD');
        const gameCanvas = document.getElementById('gameCanvas');
        const gameOver = document.getElementById('gameOver');
        const pauseScreen = document.getElementById('pauseScreen');
        const characterShop = document.getElementById('characterShop');
        const gameStatsPanel = document.getElementById('gameStatsPanel');
        const userProfile = document.getElementById('userProfile');
        
        if (mainMenu) mainMenu.style.display = 'none';
        if (gameHUD) gameHUD.style.display = 'flex';
        if (gameCanvas) gameCanvas.style.display = 'block';
        if (gameOver) gameOver.style.display = 'none';
        if (pauseScreen) pauseScreen.style.display = 'none';
        if (characterShop) characterShop.style.display = 'none';
        if (gameStatsPanel) gameStatsPanel.style.display = 'block';
        if (userProfile) userProfile.style.display = 'flex';
        
        this.hideAbilitySelection();
        this.resetGame();
        this.startWave();
        this.gameLoop();
        
        if (this.socket) {
            this.socket.emit('joinGame', { character: this.selectedCharacter });
        }
    }
    
    showCharacterShop() {
        this.gameState = 'shop';
        const mainMenu = document.getElementById('mainMenu');
        const characterShop = document.getElementById('characterShop');
        
        if (mainMenu) mainMenu.style.display = 'none';
        if (characterShop) characterShop.style.display = 'flex';
        
        this.updateCharacterPreviews();
    }
    
    hideCharacterShop() {
        this.gameState = 'menu';
        const mainMenu = document.getElementById('mainMenu');
        const characterShop = document.getElementById('characterShop');
        
        if (characterShop) characterShop.style.display = 'none';
        if (mainMenu) mainMenu.style.display = 'flex';
    }
    
    showLoginModal() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.style.display = 'flex';
    }
    
    hideLoginModal() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.style.display = 'none';
    }
    
    loginWithProvider(provider) {
        // Simulate login with provider
        console.log(`Logging in with ${provider}`);
        
        // In a real implementation, this would redirect to the provider's OAuth flow
        // For this demo, we'll just simulate a successful login
        this.userProfile.loggedIn = true;
        this.userProfile.provider = provider;
        this.userProfile.username = `${provider}User${Math.floor(Math.random() * 1000)}`;
        
        // Update UI
        const usernameElement = document.querySelector('.username');
        if (usernameElement) {
            usernameElement.textContent = this.userProfile.username;
        }
        
        // Update profile cube with provider color
        const profileCube = document.querySelector('.profile-cube');
        if (profileCube) {
            let color;
            switch(provider) {
                case 'google': color = '#4285F4'; break;
                case 'microsoft': color = '#00a4ef'; break;
                case 'steam': color = '#1b2838'; break;
                case 'xbox': color = '#107c10'; break;
                default: color = '#00ffff';
            }
            
            document.querySelectorAll('.profile-face').forEach(face => {
                face.style.borderColor = color;
                face.style.boxShadow = `0 0 10px ${color}`;
            });
        }
        
        this.hideLoginModal();
        this.setAiMessage(`Welcome, ${this.userProfile.username}! Ready to play?`);
    }
    
    selectCharacterCard(characterId) {
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-character="${characterId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            this.selectedCharacter = characterId;
        }
    }
    
    selectCharacter() {
        this.player = new Player(this.width / 2, this.height - 50, this.selectedCharacter);
        this.hideCharacterShop();
    }
    
    initCharacterPreviews() {
        const previews = document.querySelectorAll('.character-preview');
        previews.forEach((canvas, index) => {
            if (canvas && canvas.getContext) {
                const ctx = canvas.getContext('2d');
                const tempPlayer = new Player(40, 40, index);
                ctx.clearRect(0, 0, 80, 80);
                tempPlayer.draw(ctx);
            }
        });
    }
    
    updateCharacterPreviews() {
        const previews = document.querySelectorAll('.character-preview');
        previews.forEach((canvas, index) => {
            if (canvas && canvas.getContext) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 80, 80);
                const tempPlayer = new Player(40, 40, index);
                tempPlayer.draw(ctx);
            }
        });
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.gamePaused = true;
            const pauseScreen = document.getElementById('pauseScreen');
            if (pauseScreen) pauseScreen.style.display = 'flex';
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gamePaused = false;
            this.lastTime = 0;
            const pauseScreen = document.getElementById('pauseScreen');
            if (pauseScreen) pauseScreen.style.display = 'none';
        }
    }
    
    showInstructions() {
        const instructionsPanel = document.getElementById('instructionsPanel');
        if (instructionsPanel) instructionsPanel.classList.add('show');
    }
    
    hideInstructions() {
        const instructionsPanel = document.getElementById('instructionsPanel');
        if (instructionsPanel) instructionsPanel.classList.remove('show');
    }
    
    updateHUD() {
        const scoreElement = document.getElementById('score');
        const livesElement = document.getElementById('lives');
        const levelElement = document.getElementById('level');
        const xpElement = document.getElementById('xp');
        const maxXpElement = document.getElementById('maxXp');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (livesElement) livesElement.textContent = this.lives;
        if (levelElement) levelElement.textContent = this.playerLevel;
        if (xpElement) xpElement.textContent = this.xp;
        if (maxXpElement) maxXpElement.textContent = this.maxXp;
    }
    
    updateStatsPanel() {
        const attackStat = document.getElementById('attackStat');
        const defenseStat = document.getElementById('defenseStat');
        const speedStat = document.getElementById('speedStat');
        const fireRateStat = document.getElementById('fireRateStat');
        const specialStat = document.getElementById('specialStat');
        const upgradePointsElement = document.getElementById('upgradePoints');
        
        if (attackStat) attackStat.textContent = this.playerStats.attack;
        if (defenseStat) defenseStat.textContent = this.playerStats.defense;
        if (speedStat) speedStat.textContent = this.playerStats.speed;
        if (fireRateStat) fireRateStat.textContent = this.playerStats.fireRate;
        if (specialStat) specialStat.textContent = this.playerStats.special;
        if (upgradePointsElement) upgradePointsElement.textContent = this.upgradePoints;
    }
    
    upgradeStat(stat) {
        if (this.upgradePoints <= 0) {
            this.setAiMessage("You need more upgrade points!");
            return;
        }
        
        if (this.playerStats[stat] >= 10 && stat !== 'special') {
            this.setAiMessage(`${stat.charAt(0).toUpperCase() + stat.slice(1)} is already at maximum level!`);
            return;
        }
        
        this.upgradePoints--;
        this.playerStats[stat]++;
        
        // Apply stat effects
        switch(stat) {
            case 'attack':
                this.player.bulletDamage *= 1.2;
                this.setAiMessage("Attack power increased! Your bullets deal more damage.");
                break;
            case 'defense':
                this.player.defense *= 1.2;
                this.setAiMessage("Defense increased! You take less damage from enemies.");
                break;
            case 'speed':
                this.player.speed *= 1.1;
                this.setAiMessage("Speed increased! Your ship moves faster.");
                break;
            case 'fireRate':
                this.player.shotCooldown = Math.max(50, this.player.shotCooldown * 0.9);
                this.setAiMessage("Fire rate increased! You can shoot more frequently.");
                break;
            case 'special':
                this.setAiMessage("Special ability upgraded! New powers unlocked.");
                // Special abilities would be implemented here
                break;
        }
        
        this.updateStatsPanel();
    }
    
    setAiMessage(message) {
        const aiMessage = document.getElementById('aiMessage');
        if (aiMessage) {
            aiMessage.textContent = message;
        }
    }
    
    updateAiMessage() {
        // Cycle through AI messages or show contextual ones
        if (this.isBossWave && this.boss) {
            this.setAiMessage(`Boss health: ${this.boss.health}/${this.boss.maxHealth}. Keep attacking!`);
        } else {
            this.currentAiMessage = (this.currentAiMessage + 1) % this.aiMessages.length;
            this.setAiMessage(this.aiMessages[this.currentAiMessage]);
        }
    }
    
    gainXP(amount) {
        this.xp += amount;
        if (this.xp >= this.maxXp && this.playerLevel < 50) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.playerLevel++;
        this.xp = 0;
        this.maxXp = Math.floor(this.maxXp * 1.2);
        
        // Grant upgrade point on level up
        this.upgradePoints += 1;
        
        const statIncrease = this.player.getStatIncrease();
        this.lives += statIncrease.lives;
        this.player.bulletDamage += statIncrease.damage;
        this.player.defense += statIncrease.defense;
        
        this.createLevelUpEffect();
        
        // Show ability selection screen
        setTimeout(() => {
            this.showAbilitySelection();
        }, 500);
        
        if (this.player.speed < 8) {
            this.player.speed += 0.1;
        }
        if (this.player.shotCooldown > 100) {
            this.player.shotCooldown -= 5;
        }
    }
    
    createLevelUpEffect() {
        for (let i = 0; i < 30; i++) {
            this.particles.push(new LevelUpParticle(this.player.x, this.player.y));
        }
    }
    
    gameOver() {
        this.gameState = 'gameover';
        this.gameRunning = false;
        
        // Create final explosion for player
        this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 'player');
        
        const finalScore = document.getElementById('finalScore');
        const gameOver = document.getElementById('gameOver');
        const gameHUD = document.getElementById('gameHUD');
        const gameStatsPanel = document.getElementById('gameStatsPanel');
        
        if (finalScore) finalScore.textContent = this.score;
        if (gameOver) gameOver.style.display = 'flex';
        if (gameHUD) gameHUD.style.display = 'none';
        if (gameStatsPanel) gameStatsPanel.style.display = 'none';
        
        this.hideAbilitySelection();
        this.saveGameData();
    }
    
    resetGame() {
        // Reset timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Reset player
        this.player = new Player(this.width / 2, this.height - 50, this.selectedCharacter);
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.explosions = [];
        this.xpOrbs = [];
        this.healthPacks = [];
        this.boss = null;
        this.score = 0;
        this.lives = 4;
        this.playerLevel = 1;
        this.xp = 0;
        this.maxXp = 100;
        this.currentWave = 1;
        this.enemiesInWave = 3;
        this.enemiesKilledInWave = 0;
        this.enemiesSpawnedInWave = 0;
        this.waveComplete = false;
        this.showingWaveText = false;
        this.isBossWave = false;
        this.bossDefeated = false;
        this.lastEnemySpawn = 0;
        this.enemySpawnRate = this.baseEnemySpawnRate;
        
        // Reset player stats
        this.upgradePoints = 0;
        this.playerStats = {
            attack: 1,
            defense: 1,
            speed: 1,
            fireRate: 1,
            special: 0
        };
        
        // Reset abilities
        this.playerAbilities = {
            extraBullets: 0,
            bulletPenetration: 0,
            shieldStrength: 0,
            rapidFire: 0,
            homingBullets: 0,
            explosiveBullets: 0,
            healthBoost: 0,
            speedBoost: 0,
            bulletDamage: 0,
            lifeSteal: 0,
            criticalChance: 0,
            bulletSize: 0,
            magnetism: 0,
            berserker: 0,
            timeWarp: 0,
            multiShot: 0
        };
        
        // Reset respawn system
        this.playerRespawning = false;
        this.respawnTimer = 0;
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        
        // Reset AI message
        this.currentAiMessage = 0;
        this.aiMessageTimer = 0;
        this.setAiMessage(this.aiMessages[0]);
        
        this.updateHUD();
        this.updateStatsPanel();
    }
    
    // Save/Load system
    saveGameData() {
        const gameData = {
            selectedCharacter: this.selectedCharacter,
            highScore: Math.max(this.score, this.getHighScore()),
            playerLevel: this.playerLevel,
            unlockedCharacters: this.getUnlockedCharacters(),
            userProfile: this.userProfile
        };
        
        // Note: localStorage not available in this environment, using in-memory storage instead
        this.gameData = gameData;
    }
    
    loadGameData() {
        // Note: localStorage not available in this environment, using default values
        this.selectedCharacter = 0;
        
        // If we had saved user profile data, we would load it here
        if (this.gameData && this.gameData.userProfile) {
            this.userProfile = this.gameData.userProfile;
            
            // Update UI
            const usernameElement = document.querySelector('.username');
            if (usernameElement && this.userProfile.loggedIn) {
                usernameElement.textContent = this.userProfile.username;
            }
        }
    }
    
    getHighScore() {
        return this.gameData ? this.gameData.highScore || 0 : 0;
    }
    
    getUnlockedCharacters() {
        return this.gameData ? this.gameData.unlockedCharacters || [0] : [0];
    }
    
    // Multiplayer methods
    setupMultiplayer() {
        if (typeof io !== 'undefined') {
            try {
                this.socket = io();
                this.isMultiplayer = true;
                
                this.socket.on('connect', () => {
                    this.playerId = this.socket.id;
                    console.log('Connected to multiplayer server');
                    this.socket.emit('player:join', {
                        username: this.getPlayerName(),
                        avatar: this.getPlayerAvatar()
                    });
                    
                    // If multiplayer menu is open, refresh the lobby list
                    if (this.multiplayerMenu && this.multiplayerMenu.classList.contains('show')) {
                        this.refreshLobbies();
                    }
                });
                
                this.socket.on('disconnect', () => {
                    console.log('Disconnected from server');
                });
                
                this.socket.on('error', (error) => {
                    console.error('Socket error:', error);
                    alert('Connection error: ' + error);
                });
                
                // Room events
                this.socket.on('rooms:list', (rooms) => {
                    this.updateLobbyList(rooms);
                });
                
                this.socket.on('room:created', (data) => {
                    this.roomId = data.roomId;
                    this.isHost = data.isHost;
                    this.showLobbyRoom();
                });
                
                this.socket.on('room:joined', (data) => {
                    this.roomId = data.roomId;
                    this.isHost = data.isHost;
                    this.lobbyPlayers = data.players;
                    this.updateLobbyPlayers();
                    this.showLobbyRoom();
                });
                
                this.socket.on('player:joined', (player) => {
                    this.lobbyPlayers.push(player);
                    this.updateLobbyPlayers();
                    this.addChatMessage(`${player.username} joined the room`, 'system');
                });
                
                this.socket.on('player:left', (data) => {
                    this.lobbyPlayers = this.lobbyPlayers.filter(p => p.id !== data.playerId);
                    this.updateLobbyPlayers();
                    this.addChatMessage(`${data.username} left the room`, 'system');
                });
                
                this.socket.on('player:readyUpdate', (data) => {
                    const player = this.lobbyPlayers.find(p => p.id === data.playerId);
                    if (player) {
                        player.ready = data.ready;
                        this.updateLobbyPlayers();
                    }
                    
                    if (data.allReady && this.isHost) {
                        this.startCountdown();
                    }
                });
                
                this.socket.on('game:countdown', (countdown) => {
                    this.showCountdown(countdown);
                });
                
                this.socket.on('game:start', (data) => {
                    this.startMultiplayerGame(data.players);
                });
                
                this.socket.on('chat:message', (message) => {
                    this.addChatMessage(message.message, message.type, message.username);
                });
                
                this.socket.on('player:kicked', (data) => {
                    alert(data.reason);
                    this.leaveLobby();
                });
                
                // Game events
                this.socket.on('playerUpdate', (data) => {
                    this.players[data.id] = data;
                });
                
                this.socket.on('playerDisconnected', (playerId) => {
                    delete this.players[playerId];
                });
                
                this.socket.on('bulletFired', (data) => {
                    if (data.playerId !== this.playerId) {
                        this.bullets.push(new Bullet(data.x, data.y, -8));
                    }
                });
                
                setInterval(() => {
                    if (this.gameRunning && this.socket && this.multiplayerMode) {
                        this.socket.emit('game:update', {
                            roomId: this.roomId,
                            data: {
                                position: { x: this.player.x, y: this.player.y },
                                score: this.score,
                                lives: this.lives
                            }
                        });
                    }
                }, 50);
            } catch (error) {
                console.warn('Multiplayer not available:', error);
                this.isMultiplayer = false;
            }
        }
    }
    
    getPlayerName() {
        const username = document.getElementById('profileUsername');
        return username ? username.textContent : 'Player' + Math.floor(Math.random() * 1000);
    }
    
    getPlayerAvatar() {
        const avatar = document.getElementById('profileImage');
        return avatar ? avatar.src : null;
    }
    
    showMultiplayerMenu() {
        console.log('Opening multiplayer menu...');
        console.log('Main menu element:', this.mainMenu);
        console.log('Multiplayer menu element:', this.multiplayerMenu);
        
        if (this.mainMenu) {
            this.mainMenu.style.display = 'none';
        } else {
            console.error('Main menu element not found!');
        }
        
        if (this.multiplayerMenu) {
            this.multiplayerMenu.classList.add('show');
        } else {
            console.error('Multiplayer menu element not found!');
        }
        
        // Only refresh lobbies if socket is connected
        if (this.socket && this.socket.connected) {
            console.log('Socket connected, refreshing lobbies...');
            this.refreshLobbies();
        } else {
            console.log('Socket not connected, will refresh when connected');
            // Show a message that we're connecting
            const lobbyList = document.getElementById('lobbyList');
            if (lobbyList) {
                lobbyList.innerHTML = '<div class="no-lobbies">Connecting to server...</div>';
            }
        }
    }
    
    hideMultiplayerMenu() {
        this.multiplayerMenu.classList.remove('show');
        this.mainMenu.style.display = 'flex';
    }
    
    showLobbyRoom() {
        this.multiplayerMenu.classList.remove('show');
        this.lobbyRoom.classList.add('show');
        this.updateLobbyStatus();
        
        // Show admin toolbox if host
        const adminToolbox = document.getElementById('adminToolbox');
        if (adminToolbox) {
            adminToolbox.style.display = this.isHost ? 'block' : 'none';
        }
    }
    
    hideLobbyRoom() {
        this.lobbyRoom.classList.remove('show');
        this.multiplayerMenu.classList.add('show');
    }
    
    leaveLobby() {
        if (this.roomId) {
            this.socket.emit('room:leave', this.roomId);
            this.roomId = null;
            this.isHost = false;
            this.playerReady = false;
            this.lobbyPlayers = [];
        }
        this.hideLobbyRoom();
    }
    
    refreshLobbies() {
        // Request updated room list by re-joining (which triggers rooms:list)
        if (this.socket && this.socket.connected) {
            this.socket.emit('player:join', {
                username: this.getPlayerName(),
                avatar: this.getPlayerAvatar()
            });
        }
    }
    
    updateLobbyList(rooms) {
        const lobbyList = document.getElementById('lobbyList');
        lobbyList.innerHTML = '';
        
        if (rooms.length === 0) {
            lobbyList.innerHTML = '<div class="no-lobbies">No public lobbies available</div>';
            return;
        }
        
        rooms.forEach(room => {
            const lobbyItem = document.createElement('div');
            lobbyItem.className = 'lobby-item';
            lobbyItem.innerHTML = `
                <div class="lobby-info">
                    <h3>Room ${room.id}</h3>
                    <p>Host: ${room.hostUsername} | Players: ${room.playerCount}/${room.maxPlayers} | Mode: ${room.gameMode}</p>
                </div>
                <button class="join-lobby-btn" onclick="game.joinLobby('${room.id}')">JOIN</button>
            `;
            lobbyList.appendChild(lobbyItem);
        });
    }
    
    joinLobby(roomId) {
        this.socket.emit('room:join', roomId);
    }
    
    createLobby() {
        const settings = {
            roomName: document.getElementById('roomName').value || 'My Lobby',
            gameMode: document.getElementById('gameMode').value,
            difficulty: document.getElementById('difficulty').value,
            maxPlayers: parseInt(document.getElementById('maxPlayers').value),
            isPublic: document.getElementById('isPublic').checked
        };
        
        this.socket.emit('room:create', settings);
    }
    
    updateLobbyPlayers() {
        const lobbyPlayers = document.getElementById('lobbyPlayers');
        const slots = lobbyPlayers.querySelectorAll('.player-slot');
        
        slots.forEach((slot, index) => {
            const player = this.lobbyPlayers[index];
            const avatar = slot.querySelector('.player-avatar');
            const name = slot.querySelector('.player-name');
            const status = slot.querySelector('.player-status');
            const adminControls = slot.querySelector('.admin-controls');
            
            if (player) {
                avatar.classList.remove('empty');
                name.textContent = player.username;
                status.textContent = player.ready ? 'READY' : 'WAITING';
                status.className = `player-status ${player.ready ? 'ready' : ''}`;
                
                // Show admin controls for host
                if (this.isHost && player.id !== this.socket.id) {
                    adminControls.style.display = 'flex';
                } else {
                    adminControls.style.display = 'none';
                }
            } else {
                avatar.classList.add('empty');
                name.textContent = 'Empty Slot';
                status.textContent = 'WAITING';
                status.className = 'player-status';
                adminControls.style.display = 'none';
            }
        });
    }
    
    updateLobbyStatus() {
        const status = document.getElementById('lobbyStatus');
        const readyCount = this.lobbyPlayers.filter(p => p.ready).length;
        const totalPlayers = this.lobbyPlayers.length;
        
        if (totalPlayers < 2) {
            status.textContent = 'Waiting for more players...';
        } else if (readyCount === totalPlayers) {
            status.textContent = 'All players ready! Starting game...';
        } else {
            status.textContent = `${readyCount}/${totalPlayers} players ready`;
        }
    }
    
    toggleReady() {
        this.playerReady = !this.playerReady;
        this.socket.emit('player:ready', {
            roomId: this.roomId,
            ready: this.playerReady
        });
        
        const readyBtn = document.getElementById('readyBtn');
        readyBtn.textContent = this.playerReady ? 'UNREADY' : 'READY';
    }
    
    startCountdown() {
        const countdownTimer = document.getElementById('countdownTimer');
        countdownTimer.style.display = 'block';
    }
    
    showCountdown(countdown) {
        const countdownNumber = document.getElementById('countdownNumber');
        countdownNumber.textContent = countdown;
        
        if (countdown <= 0) {
            const countdownTimer = document.getElementById('countdownTimer');
            countdownTimer.style.display = 'none';
        }
    }
    
    startMultiplayerGame(players) {
        this.multiplayerMode = true;
        this.otherPlayers.clear();
        
        // Initialize other players
        players.forEach(player => {
            if (player.id !== this.socket.id) {
                this.otherPlayers.set(player.id, {
                    id: player.id,
                    username: player.username,
                    position: player.position,
                    lives: player.lives,
                    score: player.score
                });
            }
        });
        
        this.showLoadingScreen();
        
        // Start loading animation
        this.animateLoading(() => {
            this.hideLobbyRoom();
            this.startGame();
        });
    }
    
    showLoadingScreen() {
        this.loadingScreen.classList.add('show');
    }
    
    hideLoadingScreen() {
        this.loadingScreen.classList.remove('show');
    }
    
    animateLoading(callback) {
        const progress = document.getElementById('loadingProgress');
        const text = document.getElementById('loadingText');
        const messages = [
            'Initializing multiplayer session...',
            'Loading game assets...',
            'Synchronizing players...',
            'Preparing game world...',
            'Starting game...'
        ];
        
        let currentProgress = 0;
        let messageIndex = 0;
        
        const interval = setInterval(() => {
            currentProgress += Math.random() * 15 + 5;
            if (currentProgress > 100) currentProgress = 100;
            
            progress.style.width = currentProgress + '%';
            
            if (messageIndex < messages.length - 1 && currentProgress > (messageIndex + 1) * 20) {
                messageIndex++;
                text.textContent = messages[messageIndex];
            }
            
            if (currentProgress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.hideLoadingScreen();
                    callback();
                }, 500);
            }
        }, 200);
    }
    
    addChatMessage(message, type = 'chat', username = '') {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const messageText = type === 'system' ? message : `${username}: ${message}`;
        
        messageElement.innerHTML = `
            <span class="message-time">[${time}]</span>
            <span class="message-text">${messageText}</span>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Keep only last 50 messages
        while (chatMessages.children.length > 50) {
            chatMessages.removeChild(chatMessages.firstChild);
        }
    }
    
    sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (message && this.roomId) {
            this.socket.emit('chat:send', {
                roomId: this.roomId,
                message: message
            });
            chatInput.value = '';
        }
    }
    
    kickPlayer(playerId) {
        if (this.isHost) {
            this.socket.emit('player:kick', {
                roomId: this.roomId,
                targetId: playerId
            });
        }
    }
    
    updateGameSettings() {
        if (this.isHost) {
            this.gameSettings.gameSpeed = parseFloat(document.getElementById('gameSpeed').value);
            this.gameSettings.spawnRate = parseFloat(document.getElementById('spawnRate').value);
            this.gameSettings.powerupFreq = parseFloat(document.getElementById('powerupFreq').value);
            
            // Update display values
            document.getElementById('gameSpeedValue').textContent = this.gameSettings.gameSpeed.toFixed(1) + 'x';
            document.getElementById('spawnRateValue').textContent = this.gameSettings.spawnRate.toFixed(1) + 'x';
            document.getElementById('powerupFreqValue').textContent = this.gameSettings.powerupFreq.toFixed(1) + 'x';
        }
    }
    
    restart() {
        this.resetGame();
        this.startGame();
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState === 'playing') {
            this.update(currentTime);
        }
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

class Player {
    constructor(x, y, characterType = 0) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.characterType = characterType;
        this.lastShot = 0;
        
        // Base stats
        this.bulletDamage = 25;
        this.defense = 10;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        
        // Character-specific stats
        this.setCharacterStats(characterType);
    }
    
    setCharacterStats(type) {
        switch(type) {
            case 0: // Classic - Balanced
                this.speed = 5;
                this.shotCooldown = 200;
                this.color = '#00ffff';
                this.engineColor = '#ff0080';
                this.bulletDamage = 25;
                this.defense = 10;
                break;
            case 1: // Blade - Fast, Low Defense
                this.speed = 7;
                this.shotCooldown = 150;
                this.color = '#ff0080';
                this.engineColor = '#ffff00';
                this.bulletDamage = 20;
                this.defense = 5;
                break;
            case 2: // Heavy - Slow, High Defense
                this.speed = 3;
                this.shotCooldown = 300;
                this.color = '#ff4400';
                this.engineColor = '#00ff00';
                this.bulletDamage = 35;
                this.defense = 20;
                break;
            case 3: // Stealth - Fast Fire, Medium Stats
                this.speed = 6;
                this.shotCooldown = 100;
                this.color = '#8800ff';
                this.engineColor = '#00ffff';
                this.bulletDamage = 22;
                this.defense = 8;
                break;
            case 4: // Hexagon - Area Control
                this.speed = 4;
                this.shotCooldown = 250;
                this.color = '#00ff80';
                this.engineColor = '#ff8000';
                this.bulletDamage = 28;
                this.defense = 12;
                break;
            case 5: // Triangle - Precision Strike
                this.speed = 6.5;
                this.shotCooldown = 180;
                this.color = '#ffff00';
                this.engineColor = '#00ffff';
                this.bulletDamage = 30;
                this.defense = 7;
                break;
            case 6: // Star - Radial Damage
                this.speed = 4.5;
                this.shotCooldown = 220;
                this.color = '#ff00ff';
                this.engineColor = '#00ff00';
                this.bulletDamage = 27;
                this.defense = 15;
                break;
            default:
                this.speed = 5;
                this.shotCooldown = 200;
                this.color = '#00ffff';
                this.engineColor = '#ff0080';
                this.bulletDamage = 25;
                this.defense = 10;
                break;
        }
    }
    
    getStatIncrease() {
        switch(this.characterType) {
            case 0: // Classic - Balanced increases
                return { lives: 2, damage: 15, defense: 10 };
            case 1: // Blade - High damage, low defense
                return { lives: 1, damage: 20, defense: 5 };
            case 2: // Heavy - High defense, medium damage
                return { lives: 3, damage: 12, defense: 15 };
            case 3: // Stealth - Balanced with speed focus
                return { lives: 2, damage: 18, defense: 8 };
            case 4: // Hexagon - Area Control
                return { lives: 2, damage: 16, defense: 12 };
            case 5: // Triangle - Precision Strike
                return { lives: 1, damage: 22, defense: 7 };
            case 6: // Star - Radial Damage
                return { lives: 2, damage: 17, defense: 13 };
            default:
                return { lives: 2, damage: 15, defense: 10 };
        }
    }
    
    update(keys, canvasWidth, canvasHeight, deltaTime, playerStats = null, playerAbilities = null) {
        // Apply stat modifiers if provided
        let speedModifier = 1;
        if (playerStats && playerStats.speed > 1) {
            speedModifier = 1 + (playerStats.speed - 1) * 0.1;
        }
        
        // Apply speed boost ability
        if (playerAbilities && playerAbilities.speedBoost > 0) {
            speedModifier *= (1 + playerAbilities.speedBoost * 0.25);
        }
        
        const normalizedSpeed = this.speed * speedModifier * (deltaTime / 16);
        
        if (keys['a'] || keys['arrowleft']) this.x -= normalizedSpeed;
        if (keys['d'] || keys['arrowright']) this.x += normalizedSpeed;
        if (keys['w'] || keys['arrowup']) this.y -= normalizedSpeed;
        if (keys['s'] || keys['arrowdown']) this.y += normalizedSpeed;
        
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
    }
    
    shoot(bullets, playerAbilities = null) {
        // Apply fire rate modifier if available
        let cooldownModifier = 1;
        if (this.fireRateModifier && this.fireRateModifier > 1) {
            cooldownModifier = 1 / (1 + (this.fireRateModifier - 1) * 0.1);
        }
        
        // Apply rapid fire ability
        if (playerAbilities && playerAbilities.rapidFire > 0) {
            cooldownModifier *= Math.pow(0.8, playerAbilities.rapidFire);
        }
        
        const effectiveCooldown = this.shotCooldown * cooldownModifier;
        
        if (Date.now() - this.lastShot > effectiveCooldown) {
            // Calculate bullet properties
            let bulletDamage = this.bulletDamage;
            let bulletSize = 1;
            let bulletSpeed = -8;
            let piercing = false;
            
            if (playerAbilities) {
                // Apply bullet size ability
                if (playerAbilities.bulletSize > 0) {
                    bulletSize = 1 + (playerAbilities.bulletSize * 0.5);
                    bulletDamage *= (1 + playerAbilities.bulletSize * 0.3);
                }
                
                // Apply bullet penetration
                if (playerAbilities.bulletPenetration > 0) {
                    piercing = true;
                }
            }
            
            // Create main bullet(s)
            const mainBullet = new Bullet(this.x + this.width / 2 - 2, this.y, bulletSpeed, bulletDamage, 0, piercing);
            mainBullet.size = bulletSize;
            if (piercing) {
                mainBullet.penetrationsLeft = playerAbilities.bulletPenetration;
            }
            bullets.push(mainBullet);
            
            // Extra bullets ability
            if (playerAbilities && playerAbilities.extraBullets > 0) {
                for (let i = 1; i <= playerAbilities.extraBullets; i++) {
                    const offsetX = (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * 8;
                    const extraBullet = new Bullet(this.x + this.width / 2 - 2 + offsetX, this.y, bulletSpeed, bulletDamage, 0, piercing);
                    extraBullet.size = bulletSize;
                    if (piercing) {
                        extraBullet.penetrationsLeft = playerAbilities.bulletPenetration;
                    }
                    bullets.push(extraBullet);
                }
            }
            
            // Multi-shot ability
            if (playerAbilities && playerAbilities.multiShot > 0) {
                for (let i = 1; i <= playerAbilities.multiShot; i++) {
                    const angle = (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * 0.3;
                    const multiBullet = new Bullet(this.x + this.width / 2 - 2, this.y, bulletSpeed, bulletDamage * 0.8, angle, piercing);
                    multiBullet.size = bulletSize * 0.8;
                    if (piercing) {
                        multiBullet.penetrationsLeft = playerAbilities.bulletPenetration;
                    }
                    bullets.push(multiBullet);
                }
            }
            
            // Homing bullets ability
            if (playerAbilities && playerAbilities.homingBullets > 0) {
                for (let i = 0; i < playerAbilities.homingBullets; i++) {
                    const homingBullet = new HomingBullet(this.x + this.width / 2 - 2, this.y, bulletSpeed, bulletDamage * 0.9);
                    homingBullet.size = bulletSize;
                    bullets.push(homingBullet);
                }
            }
            
            // Special ship types get additional bullets
            if (this.characterType === 4) { // Hexagon - Side bullets
                bullets.push(new Bullet(this.x - 5, this.y + 10, -7.5, this.bulletDamage * 0.7, -0.3, piercing));
                bullets.push(new Bullet(this.x + this.width + 5, this.y + 10, -7.5, this.bulletDamage * 0.7, 0.3, piercing));
            } else if (this.characterType === 5) { // Triangle - Piercing bullet
                const piercingBullet = new Bullet(this.x + this.width / 2 - 2, this.y, -10, this.bulletDamage * 1.2, 0, true);
                piercingBullet.penetrationsLeft = 3;
                bullets.push(piercingBullet);
            } else if (this.characterType === 6) { // Star - Radial bullets
                for (let i = -2; i <= 2; i++) {
                    if (i !== 0) {
                        bullets.push(new Bullet(this.x + this.width / 2 - 2, this.y + 5, -7, this.bulletDamage * 0.6, i * 0.2, piercing));
                    }
                }
            }
            
            this.lastShot = Date.now();
        }
    }
    
    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.defense);
        this.health -= actualDamage;
        this.health = Math.max(0, this.health);
        return actualDamage;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        switch(this.characterType) {
            case 0: // Classic
                ctx.beginPath();
                ctx.moveTo(0, -15);
                ctx.lineTo(-10, 15);
                ctx.lineTo(0, 10);
                ctx.lineTo(10, 15);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 1: // Blade
                ctx.beginPath();
                ctx.moveTo(0, -15);
                ctx.lineTo(-8, 5);
                ctx.lineTo(-12, 15);
                ctx.lineTo(0, 12);
                ctx.lineTo(12, 15);
                ctx.lineTo(8, 5);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 2: // Heavy
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(-15, 0);
                ctx.lineTo(-12, 15);
                ctx.lineTo(0, 12);
                ctx.lineTo(12, 15);
                ctx.lineTo(15, 0);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 3: // Stealth
                ctx.beginPath();
                ctx.moveTo(0, -15);
                ctx.lineTo(-6, -5);
                ctx.lineTo(-8, 15);
                ctx.lineTo(0, 8);
                ctx.lineTo(8, 15);
                ctx.lineTo(6, -5);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 4: // Hexagon
                ctx.beginPath();
                ctx.moveTo(0, -15);
                ctx.lineTo(-10, -5);
                ctx.lineTo(-10, 10);
                ctx.lineTo(0, 15);
                ctx.lineTo(10, 10);
                ctx.lineTo(10, -5);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 5: // Triangle
                ctx.beginPath();
                ctx.moveTo(0, -15);
                ctx.lineTo(-12, 15);
                ctx.lineTo(12, 15);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 6: // Star
                ctx.beginPath();
                // Draw a 5-pointed star
                for (let i = 0; i < 5; i++) {
                    const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const innerAngle = outerAngle + Math.PI / 5;
                    
                    const outerX = Math.cos(outerAngle) * 15;
                    const outerY = Math.sin(outerAngle) * 15;
                    
                    const innerX = Math.cos(innerAngle) * 7;
                    const innerY = Math.sin(innerAngle) * 7;
                    
                    if (i === 0) {
                        ctx.moveTo(outerX, outerY);
                    } else {
                        ctx.lineTo(outerX, outerY);
                    }
                    
                    ctx.lineTo(innerX, innerY);
                }
                ctx.closePath();
                ctx.fill();
                break;
                
            default:
                ctx.beginPath();
                ctx.moveTo(0, -15);
                ctx.lineTo(-10, 15);
                ctx.lineTo(0, 10);
                ctx.lineTo(10, 15);
                ctx.closePath();
                ctx.fill();
                break;
        }
        
        // Engine glow
        ctx.fillStyle = this.engineColor;
        ctx.shadowColor = this.engineColor;
        ctx.shadowBlur = 15;
        ctx.fillRect(-3, 10, 6, 8);
        
        ctx.restore();
        this.drawHealthBar(ctx);
    }
    
    drawHealthBar(ctx) {
        const barWidth = 30;
        const barHeight = 4;
        const barX = this.x;
        const barY = this.y - 10;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

class Enemy {
    constructor(x, y, level = 1) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.level = level;
        this.speed = 2 + Math.random() * 2 + (level * 0.3);
        this.color = `hsl(${Math.random() * 60 + 300}, 100%, 50%)`;
        
        this.maxHealth = 25 + (level * 15);
        this.health = this.maxHealth;
        this.damage = 10 + (level * 5);
        this.xpReward = 20 + (level * 10);
    }
    
    update(deltaTime) {
        this.y += this.speed * (deltaTime / 16);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(-12, -12);
        ctx.lineTo(0, -8);
        ctx.lineTo(12, -12);
        ctx.closePath();
        ctx.fill();
        
        if (this.level > 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.level.toString(), 0, -15);
        }
        
        ctx.restore();
        
        if (this.level > 2) {
            this.drawHealthBar(ctx);
        }
    }
    
    drawHealthBar(ctx) {
        const barWidth = 25;
        const barHeight = 3;
        const barX = this.x;
        const barY = this.y - 8;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}

class Boss {
    constructor(x, y, waveNumber = 10, healthMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 80;
        this.speed = 1 + (waveNumber / 50);
        this.waveNumber = waveNumber;
        
        this.maxHealth = 1000 * healthMultiplier;
        this.health = this.maxHealth;
        this.damage = 50 + (waveNumber * 5);
        this.bulletDamage = 20 + (waveNumber * 2);
        
        this.color = '#ff0000';
        this.direction = 1;
        this.lastShot = 0;
        this.shotCooldown = Math.max(500, 1000 - (waveNumber * 20));
        
        if (waveNumber >= 30) {
            this.color = '#ff00ff';
        } else if (waveNumber >= 20) {
            this.color = '#ffaa00';
        }
    }
    
    update(deltaTime) {
        const normalizedSpeed = this.speed * (deltaTime / 16);
        
        if (this.y < 50) {
            this.y += normalizedSpeed;
        } else {
            this.x += this.direction * normalizedSpeed * 2;
            if (this.x <= 0 || this.x >= 800 - this.width) {
                this.direction *= -1;
            }
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        ctx.fillRect(-50, -40, 100, 80);
        
        if (this.waveNumber >= 30) {
            ctx.fillRect(-60, -30, 20, 60);
            ctx.fillRect(40, -30, 20, 60);
            ctx.fillRect(-40, -50, 80, 20);
            
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 30 + Math.sin(Date.now() * 0.01) * 5, 0, Math.PI * 2);
            ctx.stroke();
            
        } else if (this.waveNumber >= 20) {
            ctx.fillRect(-60, -20, 20, 40);
            ctx.fillRect(40, -20, 20, 40);
            ctx.fillRect(-30, -50, 60, 15);
            
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(-15, -15, 30, 30);
            
        } else {
            ctx.fillRect(-60, -20, 20, 40);
            ctx.fillRect(40, -20, 20, 40);
            
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(-15, -15, 30, 30);
        }
        
        ctx.restore();
        this.drawHealthBar(ctx);
    }
    
    drawHealthBar(ctx) {
        const barWidth = 100;
        const barHeight = 8;
        const barX = this.x;
        const barY = this.y - 15;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(this.health)}/${this.maxHealth}`, this.x + barWidth / 2, barY - 5);
    }
}

class Bullet {
    constructor(x, y, speed, damage = 25, angleOffset = 0, piercing = false) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 8;
        this.speed = speed;
        this.damage = damage;
        this.vx = Math.sin(angleOffset) * Math.abs(speed);
        this.vy = speed;
        this.piercing = piercing;
        this.penetrationsLeft = piercing ? 1 : 0;
        this.size = 1;
        this.destroyed = false;
    }
    
    update(deltaTime, enemies = [], playerAbilities = null) {
        const normalizedTime = deltaTime / 16;
        this.x += this.vx * normalizedTime;
        this.y += this.vy * normalizedTime;
        
        // Update size based on bullet size ability
        if (this.size > 1) {
            this.width = 4 * this.size;
            this.height = 8 * this.size;
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        if (this.piercing) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.fillRect(this.x, this.y, this.width, this.height * 1.5);
            
            ctx.globalAlpha = 0.5;
            ctx.fillRect(this.x, this.y + this.height, this.width, this.height * 0.5);
        } else {
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 5;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        ctx.restore();
    }
}

class HomingBullet extends Bullet {
    constructor(x, y, speed, damage) {
        super(x, y, speed, damage);
        this.target = null;
        this.homingStrength = 0.1;
        this.color = '#ff00ff';
    }
    
    update(deltaTime, enemies = [], playerAbilities = null) {
        const normalizedTime = deltaTime / 16;
        
        // Find nearest enemy if no target
        if (!this.target || this.target.health <= 0) {
            let nearestDistance = Infinity;
            this.target = null;
            
            enemies.forEach(enemy => {
                const dx = enemy.x + enemy.width/2 - (this.x + this.width/2);
                const dy = enemy.y + enemy.height/2 - (this.y + this.height/2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    this.target = enemy;
                }
            });
        }
        
        // Home towards target
        if (this.target) {
            const dx = this.target.x + this.target.width/2 - (this.x + this.width/2);
            const dy = this.target.y + this.target.height/2 - (this.y + this.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                this.vx += (dx / distance) * this.homingStrength;
                this.vy += (dy / distance) * this.homingStrength;
                
                // Normalize speed
                const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                const targetSpeed = Math.abs(this.speed);
                this.vx = (this.vx / currentSpeed) * targetSpeed;
                this.vy = (this.vy / currentSpeed) * targetSpeed;
            }
        }
        
        this.x += this.vx * normalizedTime;
        this.y += this.vy * normalizedTime;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw homing trail
        ctx.globalAlpha = 0.3;
        ctx.fillRect(this.x - 1, this.y + this.height, this.width + 2, 4);
        ctx.restore();
    }
}

class EnemyBullet {
    constructor(x, y, speed, damage = 10, angleOffset = 0) {
        this.x = x - 2;
        this.y = y;
        this.width = 4;
        this.height = 8;
        this.speed = speed;
        this.damage = damage;
        this.vx = Math.sin(angleOffset) * Math.abs(speed);
        this.vy = speed;
    }
    
    update(deltaTime) {
        const normalizedTime = deltaTime / 16;
        this.x += this.vx * normalizedTime;
        this.y += this.vy * normalizedTime;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

class XPOrb {
    constructor(x, y, value = 10) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.value = value;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = Math.random() * 2 + 1;
        this.life = 1;
        this.decay = 0.005;
        this.color = '#00ff00';
        this.pulseTime = 0;
    }
    
    update(deltaTime) {
        const normalizedTime = deltaTime / 16;
        this.x += this.vx * normalizedTime;
        this.y += this.vy * normalizedTime;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay * normalizedTime;
        this.pulseTime += deltaTime * 0.01;
    }
    
    draw(ctx) {
        ctx.save();
        const pulse = Math.sin(this.pulseTime) * 0.3 + 0.7;
        ctx.globalAlpha = this.life * pulse;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class HealthPack {
    constructor(x, y, healAmount = 25) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.healAmount = healAmount;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = Math.random() * 2 + 1;
        this.life = 1;
        this.decay = 0.003;
        this.color = '#ff0080';
        this.pulseTime = 0;
    }
    
    update(deltaTime) {
        const normalizedTime = deltaTime / 16;
        this.x += this.vx * normalizedTime;
        this.y += this.vy * normalizedTime;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay * normalizedTime;
        this.pulseTime += deltaTime * 0.008;
    }
    
    draw(ctx) {
        ctx.save();
        const pulse = Math.sin(this.pulseTime) * 0.4 + 0.8;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        // Draw cross shape
        const size = this.width/2 * pulse;
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        ctx.fillRect(centerX - size, centerY - size/3, size * 2, size * 2/3);
        ctx.fillRect(centerX - size/3, centerY - size, size * 2/3, size * 2);
        
        ctx.restore();
    }
}

class Explosion {
    constructor(x, y, type = 'default') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.frame = 0;
        this.maxFrames = type === 'boss' ? 30 : type === 'player' ? 25 : type === 'explosive' ? 35 : 15;
        this.size = type === 'boss' ? 80 : type === 'player' ? 60 : type === 'explosive' ? 100 : 40;
        this.finished = false;
        
        switch(type) {
            case 'boss':
                this.colors = ['#ff0000', '#ff4400', '#ff8800', '#ffaa00'];
                break;
            case 'player':
                this.colors = ['#00ffff', '#0088ff', '#0044ff', '#0000ff'];
                break;
            case 'enemy':
                this.colors = ['#ff0080', '#ff4080', '#ff8080', '#ffaaaa'];
                break;
            case 'explosive':
                this.colors = ['#ffaa00', '#ff8800', '#ff4400', '#ff0000'];
                break;
            default:
                this.colors = ['#ffff00', '#ffaa00', '#ff8800', '#ff4400'];
                break;
        }
    }
    
    update(deltaTime) {
        this.frame += deltaTime / 50;
        if (this.frame >= this.maxFrames) {
            this.finished = true;
        }
    }
    
    draw(ctx) {
        if (this.finished) return;
        
        const progress = this.frame / this.maxFrames;
        const currentSize = this.size * (1 - progress * 0.5);
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        
        for (let i = 0; i < this.colors.length; i++) {
            const ringSize = currentSize * (1 - i * 0.2);
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, ringSize);
            gradient.addColorStop(0, this.colors[i]);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, type = 'default') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.02;
        this.size = Math.random() * 4 + 2;
        
        switch(type) {
            case 'boss':
                this.color = `hsl(${Math.random() * 60}, 100%, 60%)`;
                this.decay = 0.015;
                break;
            case 'player':
                this.color = `hsl(${180 + Math.random() * 60}, 100%, 60%)`;
                this.decay = 0.018;
                break;
            case 'enemy':
                this.color = `hsl(${300 + Math.random() * 60}, 100%, 60%)`;
                break;
            case 'explosive':
                this.color = `hsl(${Math.random() * 60 + 15}, 100%, 60%)`;
                this.vx *= 1.5;
                this.vy *= 1.5;
                break;
            default:
                this.color = `hsl(${Math.random() * 60 + 15}, 100%, 60%)`;
                break;
        }
    }
    
    update(deltaTime) {
        const normalizedTime = deltaTime / 16;
        this.x += this.vx * normalizedTime;
        this.y += this.vy * normalizedTime;
        this.life -= this.decay * normalizedTime;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.restore();
    }
}

class CriticalParticle extends Particle {
    constructor(x, y) {
        super(x, y, 'default');
        this.color = '#ffff00';
        this.vy = -Math.random() * 4 - 2;
        this.decay = 0.025;
        this.size = Math.random() * 3 + 4;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.font = `${this.size * 3}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('CRIT!', this.x, this.y);
        ctx.restore();
    }
}

class HealParticle extends Particle {
    constructor(x, y) {
        super(x, y, 'default');
        this.color = '#00ff80';
        this.vy = -Math.random() * 3 - 1;
        this.decay = 0.02;
        this.size = Math.random() * 2 + 3;
    }
}

class LevelUpParticle extends Particle {
    constructor(x, y) {
        super(x, y, 'default');
        this.color = '#00ff80';
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = -Math.random() * 3 - 2;
        this.decay = 0.015;
        this.size = Math.random() * 4 + 2;
    }
    
    update(deltaTime) {
        const normalizedTime = deltaTime / 16;
        this.x += this.vx * normalizedTime;
        this.y += this.vy * normalizedTime;
        this.life -= this.decay * normalizedTime;
        this.vy += 0.1 * normalizedTime;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Make game globally accessible for debugging
    window.game = game;
    
    // Add test function for multiplayer button
    window.testMultiplayer = () => {
        console.log('Testing multiplayer button...');
        const button = document.getElementById('multiplayerBtn');
        if (button) {
            console.log('Button found, clicking...');
            button.click();
        } else {
            console.error('Multiplayer button not found!');
        }
    };
    
    // Add CSS animations for ability selection
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .ability-card:hover {
            transform: translateY(-10px) scale(1.05) !important;
        }
    `;
    document.head.appendChild(style);
});

