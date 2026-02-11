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

app.post('/negotiate', (req, res) => {
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

    if (playerTower.hp < 60 && resources > 0) {
        const armorAmount = Math.min(resources, 25); 
        actions.push({ type: "armor", amount: armorAmount });
        resources -= armorAmount;
    }

    let revengeTargetId = null;
    if (playerTower.hp < 50 && previousAttacks && previousAttacks.length > 0 && resources >= 10) {
        revengeTargetId = previousAttacks[0].playerId;
        actions.push({ type: "attack", targetId: revengeTargetId, troopCount: 10 });
        resources -= 10;
    }


    if (aliveEnemies.length > 1 && costToUpgrade && resources >= costToUpgrade && playerTower.level < 5) {
        actions.push({ type: "upgrade" });
        resources -= costToUpgrade;
    }

    if (resources > 0 && aliveEnemies.length > 0) {
        
        if (turn <= 3 && !revengeTargetId) {
            return res.json(actions);
        }

        if (aliveEnemies.length === 1) {
            const opponent = aliveEnemies[0];
            const opponentIncome = Math.floor(20 * Math.pow(1.5, opponent.level - 1));

            actions.push({
                type: "attack",
                targetId: opponent.playerId,
                troopCount: resources 
            });
            resources = 0;
        } 
        else {
            const target = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];
            
            const killAmount = target.hp + (target.armor || 0) + 2;
            const attackAmount = Math.min(resources, killAmount);

            if (playerTower.level < 3 && attackAmount < killAmount && playerTower.hp > 50) {
                return res.json(actions);
            }

            actions.push({ type: "attack", targetId: target.playerId, troopCount: attackAmount });
            resources -= attackAmount;
        }
    }

    res.json(actions);
});

app.listen(PORT, () => console.log(`🚀 HardCode Ultimate Bot on port ${PORT}`));