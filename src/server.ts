import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8000;

const logBot = () => console.log('[KW-BOT] Mega ogudor');

app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});

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

  if (!enemyTowers || enemyTowers.length === 0) return res.json([]);

  const strongest = [...enemyTowers].sort((a, b) => (b.hp + b.armor) - (a.hp + a.armor))[0];
  const weakest = [...enemyTowers].sort((a, b) => a.hp - b.hp)[0];

  res.json([
    {
      allyId: strongest.playerId,
      attackTargetId: weakest.playerId
    }
  ]);
});

// 4. Combat Phase
app.post('/combat', (req: Request, res: Response) => {
  logBot();
  const { playerTower, enemyTowers } = req.body;
  let resources = playerTower.resources;
  const actions: any[] = [];

  const upgradeCosts: { [key: number]: number } = {
    1: 50,
    2: 88,
    3: 153,
    4: 268,
    5: 469
  };

  const currentLevel = playerTower.level;
  const costToUpgrade = upgradeCosts[currentLevel];


  if (playerTower.hp < 50 && playerTower.armor < 10 && resources > 0) {
    const armorAmount = Math.min(resources, 20);
    actions.push({ type: "armor", amount: armorAmount });
    resources -= armorAmount;
  }

  if (costToUpgrade && resources >= costToUpgrade && playerTower.level < 4) {
    actions.push({ type: "upgrade" });
    resources -= costToUpgrade;
  }

  if (resources > 0 && enemyTowers.length > 0) {
    const target = [...enemyTowers].sort((a, b) => a.hp - b.hp)[0];
    
    actions.push({
      type: "attack",
      targetId: target.playerId,
      troopCount: resources
    });
    resources = 0;
  }

  res.json(actions);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});