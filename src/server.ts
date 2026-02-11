import express, { Request, Response } from 'express';
import cors from 'cors';

/**
 * HARDCODE ULTIMATE BOT - FINAL VERSION
 * Strategy: Fast Economy into Aggressive Mid-Game Control
 */

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8000;

// Log collector requirement
const logBot = () => console.log('[KW-BOT] Mega ogudor');

// Helper to calculate next upgrade cost
const getUpgradeCost = (level: number): number => {
    const costs: { [key: number]: number } = { 1: 50, 2: 88, 3: 153, 4: 268, 5: 469 };
    return costs[level] || 9999;
};

// 1. Health Check
app.get('/healthz', (req: Request, res: Response) => {
    res.status(200).json({ status: "OK" });
});

// 2. Metadata Info
app.get('/info', (req: Request, res: Response) => {
    logBot();
    res.json({
        name: "HardCode",
        strategy: "AI-trapped-strategy",
        version: "1.0"
    });
});

// 3. Negotiation Phase
app.post('/negotiate', (req: Request, res: Response) => {
    logBot();
    const { enemyTowers } = req.body;
    const aliveEnemies = enemyTowers.filter((t: any) => t.hp > 0);
    
    if (aliveEnemies.length === 0) return res.json([]);

    // Logic: Form alliance with the strongest to suppress the weakest
    const strongest = [...aliveEnemies].sort((a, b) => (b.hp + b.armor) - (a.hp + a.armor))[0];
    const weakest = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];

    res.json([{
        allyId: strongest.playerId,
        attackTargetId: weakest.playerId
    }]);
});

// 4. Combat Phase - The Core Brain
app.post('/combat', (req: Request, res: Response) => {
    logBot();
    const { playerTower, enemyTowers, turn, previousAttacks } = req.body;
    let resources = playerTower.resources;
    const actions: any[] = [];
    const aliveEnemies = enemyTowers.filter((t: any) => t.hp > 0);
    
    const costToUpgrade = getUpgradeCost(playerTower.level);
    const beingAttacked = previousAttacks && previousAttacks.length > 0;
    
    // Survival Analytics
    const minEnemyHp = aliveEnemies.length > 0 ? Math.min(...aliveEnemies.map((e: any) => e.hp)) : 100;
    const isWeakestInGame = playerTower.hp <= minEnemyHp;

    // --- PHASE 1: ROUND 1 SPECIAL START ---
    if (turn === 1) {
        // Strategy: 10 Armor, 10 for Upgrade path (Total 20 resource turn start)
        if (resources >= 10) {
            actions.push({ type: "armor", amount: 10 });
            resources -= 10;
        }
        // Save the rest for upgrade
        return res.json(actions);
    }

    // --- PHASE 2: ECONOMIC TURBO (Waiting for Level 2) ---
    if (playerTower.level < 2) {
        // If someone attacks us while we are Level 1, we must defend
        if (beingAttacked || isWeakestInGame || playerTower.hp < 70) {
            const defensiveArmor = Math.min(resources, 15);
            actions.push({ type: "armor", amount: defensiveArmor });
            resources -= defensiveArmor;

            // Retaliate only if attacked, with minimal force
            if (beingAttacked && resources >= 5) {
                actions.push({
                    type: "attack",
                    targetId: previousAttacks[0].playerId,
                    troopCount: 5
                });
                resources -= 5;
            }
        } else {
            // Passive stance: slow armor build while saving for Level 2
            if (playerTower.armor < 30 && resources >= 5) {
                actions.push({ type: "armor", amount: 5 });
                resources -= 5;
            }
        }

        // Apply Upgrade as soon as possible
        if (resources >= costToUpgrade) {
            actions.push({ type: "upgrade" });
            resources -= costToUpgrade;
        }
        return res.json(actions);
    }

    // --- PHASE 3: ADVANCED LOGIC (POST LEVEL 2) ---

    // A. Priority 1: Survival & Damage Control
    if (isWeakestInGame || playerTower.hp < 40) {
        // Emergency Armor: Scale with resources
        const emergencyArmor = Math.min(resources, Math.floor(resources * 0.4) + 10);
        if (emergencyArmor > 0) {
            actions.push({ type: "armor", amount: emergencyArmor });
            resources -= emergencyArmor;
        }
    } else if (playerTower.armor < 50) {
        // Constant armor buffering to prevent chip damage
        const bufferArmor = Math.min(resources, 8);
        actions.push({ type: "armor", amount: bufferArmor });
        resources -= bufferArmor;
    }

    // B. Priority 2: Economic Dominance
    // Keep upgrading to reach Level 5 for 101 res/turn
    if (resources >= costToUpgrade && playerTower.level < 5) {
        actions.push({ type: "upgrade" });
        resources -= costToUpgrade;
    }

    // C. Priority 3: Strategic Offense
    if (resources > 0 && aliveEnemies.length > 0) {
        
        // 1. FINAL DUEL: All-in strategy
        if (aliveEnemies.length === 1) {
            actions.push({
                type: "attack",
                targetId: aliveEnemies[0].playerId,
                troopCount: resources
            });
            resources = 0;
        } 
        
        // 2. MULTI-TARGET: Target the weakest link
        else if (!isWeakestInGame) {
            const target = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];
            const targetHealthPool = target.hp + (target.armor || 0);
            
            // Calculation: How much can we afford to spend while staying safe?
            // Spend up to 75% of current resources, or enough to kill if possible
            const safeSpending = Math.floor(resources * 0.75);
            const attackPower = Math.min(resources, targetHealthPool + 1, safeSpending);

            if (attackPower > 5) {
                actions.push({
                    type: "attack",
                    targetId: target.playerId,
                    troopCount: attackPower
                });
                resources -= attackPower;
            }
        }
    }

    res.json(actions);
});

// App Initiation
app.listen(PORT, () => {
    console.log(`🚀 HardCode Ultimate Server running on port ${PORT}`);
});