import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8000;

const logBot = () => console.log('[KW-BOT] Mega ogudor');

// 1. Health Check Endpoint
app.get('/healthz', (req: Request, res: Response) => {
    res.status(200).json({ status: "OK" });
});

// 2. Metadata Endpoint
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

    const strongest = [...aliveEnemies].sort((a, b) => (b.hp + b.armor) - (a.hp + a.armor))[0];
    const weakest = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];

    res.json([{
        allyId: strongest.playerId,
        attackTargetId: weakest.playerId
    }]);
});

// 4. Combat Phase
app.post('/combat', (req: Request, res: Response) => {
    logBot();
    const { playerTower, enemyTowers } = req.body;
    let resources = playerTower.resources;
    const actions: any[] = [];
    
    const aliveEnemies = enemyTowers.filter((t: any) => t.hp > 0);

    const upgradeCosts: { [key: number]: number } = { 
        1: 50, 
        2: 88, 
        3: 153, 
        4: 268, 
        5: 469 
    };

    const costToUpgrade = upgradeCosts[playerTower.level];

    if (playerTower.hp < 60 && resources > 0) {
        const armorAmount = Math.min(resources, 20);
        actions.push({ type: "armor", amount: armorAmount });
        resources -= armorAmount;
    }

    if (aliveEnemies.length > 1 && costToUpgrade && resources >= costToUpgrade && playerTower.level < 4) {
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
        } else {
            if (playerTower.level < 3 && playerTower.hp > 45) {
                return res.json(actions);
            }

            const target = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];
            
            const killAmount = target.hp + (target.armor || 0) + 2;
            const attackAmount = Math.min(resources, killAmount);

            actions.push({
                type: "attack",
                targetId: target.playerId,
                troopCount: attackAmount
            });
            resources -= attackAmount;
        }
    }

    res.json(actions);
});

app.listen(PORT, () => {
    console.log(`🚀 HardCode Bot is live on port ${PORT}`);
});