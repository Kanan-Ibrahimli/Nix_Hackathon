import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8000;
const logBot = () => console.log('[KW-BOT] Mega ogudor');

app.get('/healthz', (req, res) => res.status(200).json({ status: "OK" }));

app.get('/info', (req, res) => {
    logBot();
    res.json({
        name: "HardCode",
        strategy: "AI-trapped-strategy",
        version: "1.0"
    });
});

app.post('/negotiate', (req: Request, res: Response) => {
    logBot();
    const { enemyTowers } = req.body;
    const aliveEnemies = enemyTowers.filter((t: any) => t.hp > 0);
    if (aliveEnemies.length === 0) return res.json([]);

    const strongest = [...aliveEnemies].sort((a, b) => (b.hp + b.armor) - (a.hp + a.armor))[0];
    const weakest = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];

    res.json([{ allyId: strongest.playerId, attackTargetId: weakest.playerId }]);
});

app.post('/combat', (req: Request, res: Response) => {
    logBot();
    const { playerTower, enemyTowers, turn, previousAttacks } = req.body;
    let resources = playerTower.resources;
    const actions: any[] = [];
    const aliveEnemies = enemyTowers.filter((t: any) => t.hp > 0);

    const upgradeCosts: { [key: number]: number } = { 1: 50, 2: 88, 3: 153, 4: 268, 5: 469 };
    const costToUpgrade = upgradeCosts[playerTower.level];

    const minEnemyHp = aliveEnemies.length > 0 ? Math.min(...aliveEnemies.map((e: any) => e.hp)) : 100;
    const isWeakerThanOthers = playerTower.hp <= minEnemyHp;

    // ROUND 1: Initial Reconnaissance
    if (turn === 1) {
        if (resources >= 6) {
            actions.push({ type: "armor", amount: 6 });
            resources -= 6;
        }
        aliveEnemies.forEach((enemy: any) => {
            if (resources >= 2) {
                actions.push({ type: "attack", targetId: enemy.playerId, troopCount: 2 });
                resources -= 2;
            }
        });
        return res.json(actions);
    }

    // INTERMEDIATE PHASE: Waiting for Level 2
    // If turn > 1 and level < 2, we don't attack unless provoked
    const beingAttacked = previousAttacks && previousAttacks.length > 0;
    
    if (playerTower.level < 2 && turn > 1) {
        // Defensive priority
        if (beingAttacked || isWeakerThanOthers) {
            const defensiveArmor = Math.min(resources, 15);
            actions.push({ type: "armor", amount: defensiveArmor });
            resources -= defensiveArmor;
            
            // Minimal counter-attack to discourage attackers
            if (beingAttacked && resources >= 5) {
                actions.push({ type: "attack", targetId: previousAttacks[0].playerId, troopCount: 5 });
                resources -= 5;
            }
        } else {
            // Passive saving for Upgrade
            if (resources >= 5 && playerTower.armor < 40) {
                actions.push({ type: "armor", amount: 5 });
                resources -= 5;
            }
        }

        if (costToUpgrade && resources >= costToUpgrade) {
            actions.push({ type: "upgrade" });
            resources -= costToUpgrade;
        }
        return res.json(actions);
    }

    // POST LEVEL 2 LOGIC
    // 1. Emergency Defense (Survival)
    if (isWeakerThanOthers || playerTower.hp < 45) {
        const emergencyArmor = Math.min(resources, 25);
        if (emergencyArmor > 0) {
            actions.push({ type: "armor", amount: emergencyArmor });
            resources -= emergencyArmor;
        }
    } else if (playerTower.armor < 50) {
        // Maintain a healthy armor buffer
        const maintainArmor = Math.min(resources, 10);
        actions.push({ type: "armor", amount: maintainArmor });
        resources -= maintainArmor;
    }

    // 2. Continuous Upgrading (Economy is King)
    if (costToUpgrade && resources >= costToUpgrade && playerTower.level < 5) {
        actions.push({ type: "upgrade" });
        resources -= costToUpgrade;
    }

    // 3. Attack Logic
    if (resources > 0 && aliveEnemies.length > 0) {
        // DUEL MODE: Last enemy standing
        if (aliveEnemies.length === 1) {
            actions.push({
                type: "attack",
                targetId: aliveEnemies[0].playerId,
                troopCount: resources
            });
            resources = 0;
        } 
        // STRATEGIC STRIKE: Target weakest with controlled resources
        else if (playerTower.level >= 2 && !isWeakerThanOthers) {
            const target = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];
            const killAmount = target.hp + (target.armor || 0) + 1;
            
            // Use up to 80% of resources for attack, keep 20% for next turn safety
            const attackAmount = Math.min(resources, killAmount, Math.floor(resources * 0.8) + 1);
            
            actions.push({ type: "attack", targetId: target.playerId, troopCount: attackAmount });
            resources -= attackAmount;
        }
    }

    res.json(actions);
});

app.listen(PORT, () => console.log(`🚀 HardCode Survival-G-V3 on port ${PORT}`));