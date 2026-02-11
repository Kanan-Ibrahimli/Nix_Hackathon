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
    const { playerTower, enemyTowers, turn } = req.body;
    let resources = playerTower.resources;
    const actions: any[] = [];
    const aliveEnemies = enemyTowers.filter((t: any) => t.hp > 0);

    const upgradeCosts: { [key: number]: number } = { 1: 50, 2: 88, 3: 153, 4: 268, 5: 469 };
    const costToUpgrade = upgradeCosts[playerTower.level];

    if (turn <= 5) {
        if (resources >= 5) {
            actions.push({ type: "armor", amount: 5 });
            resources -= 5;
        }

        if (costToUpgrade && resources >= costToUpgrade) {
            actions.push({ type: "upgrade" });
            resources -= costToUpgrade;
        }

        if (resources >= 5 && aliveEnemies.length > 0) {
            const target = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];
            actions.push({ type: "attack", targetId: target.playerId, troopCount: 5 });
            resources -= 5;
        }

        return res.json(actions);
    }

    
    if (costToUpgrade && resources >= costToUpgrade && playerTower.level < 5) {
        actions.push({ type: "upgrade" });
        resources -= costToUpgrade;
    }

    if (resources > 0 && aliveEnemies.length > 0) {
        if (aliveEnemies.length === 1) {
            actions.push({
                type: "attack",
                targetId: aliveEnemies[0].playerId,
                troopCount: resources
            });
            resources = 0;
        } 
        else {
            const target = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];
            
            if (playerTower.level >= 2) {
                const attackAmount = Math.min(resources, 20);
                actions.push({ type: "attack", targetId: target.playerId, troopCount: attackAmount });
                resources -= attackAmount;
            } 
            else {
                const killAmount = target.hp + (target.armor || 0) + 2;
                if (resources >= killAmount) {
                    actions.push({ type: "attack", targetId: target.playerId, troopCount: killAmount });
                    resources -= killAmount;
                }
            }
        }
    }

    res.json(actions);
});

app.listen(PORT, () => console.log(`🚀 HardCode Tactical Bot on port ${PORT}`));