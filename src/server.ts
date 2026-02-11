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

    // Check if we are the weakest player in the field
    const minEnemyHp = aliveEnemies.length > 0 ? Math.min(...aliveEnemies.map((e: any) => e.hp)) : 100;
    const isWeakerThanOthers = playerTower.hp <= minEnemyHp;

    // ROUND 1 LOGIC
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

    // ROUND 2 LOGIC
    if (turn === 2) {
        const beingAttacked = previousAttacks && previousAttacks.length > 0;
        if (resources >= 10) {
            actions.push({ type: "armor", amount: 10 });
            resources -= 10;
        }
        if (!beingAttacked) return res.json(actions);
        const attacker = previousAttacks[0];
        const attackBack = Math.min(resources, 5);
        actions.push({ type: "attack", targetId: attacker.playerId, troopCount: attackBack });
        resources -= attackBack;
        return res.json(actions);
    }

    // SURVIVAL MODE: If we are the weakest or HP is very low, focus purely on armor
    if (isWeakerThanOthers || playerTower.hp < 40) {
        const defensiveArmor = Math.min(resources, 30); // Heavy investment in defense
        if (defensiveArmor > 0) {
            actions.push({ type: "armor", amount: defensiveArmor });
            resources -= defensiveArmor;
        }
    } else {
        // Standard defense if not in immediate danger
        if (resources >= 5 && playerTower.armor < 60) {
            actions.push({ type: "armor", amount: 5 });
            resources -= 5;
        }
    }

    // UPGRADE PRIORITY
    if (costToUpgrade && resources >= costToUpgrade && playerTower.level < 5) {
        actions.push({ type: "upgrade" });
        resources -= costToUpgrade;
    }

    // ATTACK LOGIC
    if (resources > 0 && aliveEnemies.length > 0) {
        // DUEL MODE: 1v1
        if (aliveEnemies.length === 1) {
            actions.push({
                type: "attack",
                targetId: aliveEnemies[0].playerId,
                troopCount: resources
            });
            resources = 0;
        } 
        // LEVEL 2+ ATTACK (Only if we aren't struggling to survive)
        else if (playerTower.level >= 2 && !isWeakerThanOthers) {
            const target = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];
            const killAmount = target.hp + (target.armor || 0) + 1;
            const attackAmount = Math.min(resources, killAmount, Math.floor(resources * 0.7) + 1);
            
            actions.push({ type: "attack", targetId: target.playerId, troopCount: attackAmount });
            resources -= attackAmount;
        }
    }

    res.json(actions);
});

app.listen(PORT, () => console.log(`🚀 HardCode Survival-Genius Bot on port ${PORT}`));