import React, { useContext, useEffect, useState } from "react";
import { useSelector } from "@xstate/react";
import Decimal from "decimal.js-light";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { InnerPanel } from "components/ui/Panel";
import { Context } from "features/game/GameProvider";
import type { MachineState } from "features/game/lib/gameMachine";
import type { InventoryItemName } from "features/game/types/game";
import { ITEM_DETAILS } from "features/game/types/images";
import { formatNumber } from "lib/utils/formatNumber";

import tokenIcon from "assets/icons/token.png";
import lockIcon from "assets/icons/lock.png";
import harvestIcon from "assets/icons/bountiful_harvest_icon.webp";

export interface StakingTier {
  level: number;
  name: string;
  amount: number;
  lockDays: number;
  dailyPyra: number;
  apyPercent: number;
  seeds: Partial<Record<InventoryItemName, number>>;
}

export const STAKING_TIERS: StakingTier[] = [
  {
    level: 1,
    name: "Apprentice",
    amount: 1000,
    lockDays: 7,
    dailyPyra: 0.3,
    apyPercent: 11,
    seeds: {
      "Cauliflower Seed": 10,
      "Parsnip Seed": 5,
    },
  },
  {
    level: 2,
    name: "Harvester",
    amount: 5000,
    lockDays: 14,
    dailyPyra: 1.8,
    apyPercent: 13,
    seeds: {
      "Eggplant Seed": 15,
      "Radish Seed": 10,
    },
  },
  {
    level: 3,
    name: "Agronomist",
    amount: 20000,
    lockDays: 21,
    dailyPyra: 8.0,
    apyPercent: 14.5,
    seeds: {
      "Wheat Seed": 25,
      "Kale Seed": 15,
    },
  },
  {
    level: 4,
    name: "Grand Patriarch",
    amount: 50000,
    lockDays: 30,
    dailyPyra: 22.0,
    apyPercent: 16,
    seeds: {
      "Wheat Seed": 40,
      "Kale Seed": 25,
      "Corn Seed": 15,
    },
  },
];

interface ActiveStake {
  level: number;
  amount: number;
  stakedAt: number;
  lockUntil: number;
  lastClaimedAt: number;
}

const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.slice(0, 3).join(" ");
}

const _state = (state: MachineState) => state.context.state;
const _farmId = (state: MachineState) => state.context.farmId;

export const Staking: React.FC = () => {
  const { gameService } = useContext(Context);
  const state = useSelector(gameService, _state);
  const farmId = useSelector(gameService, _farmId);

  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [activeStake, setActiveStake] = useState<ActiveStake | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [message, setMessage] = useState<string | null>(null);

  const storageKey = `pyra_staking_${farmId ?? "default"}`;

  // Load existing staking state
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ActiveStake;
        setActiveStake(parsed);
        setSelectedLevel(parsed.level);
      }
    } catch (e) {
      // ignore
    }
  }, [storageKey]);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTier =
    STAKING_TIERS.find((t) => t.level === (activeStake?.level ?? selectedLevel)) ??
    STAKING_TIERS[0];

  const userBalance = state.balance ?? new Decimal(0);

  // Handle Stake Action
  const handleStake = () => {
    if (activeStake) return;
    if (userBalance.lessThan(currentTier.amount)) {
      setMessage("Insufficient $PYRA balance to stake this tier.");
      return;
    }

    const now = Date.now();
    const lockUntil = now + currentTier.lockDays * 24 * 60 * 60 * 1000;
    const newStake: ActiveStake = {
      level: currentTier.level,
      amount: currentTier.amount,
      stakedAt: now,
      lockUntil,
      lastClaimedAt: now,
    };

    const newBalance = userBalance.sub(currentTier.amount);

    gameService.send("UPDATE", {
      state: {
        ...state,
        balance: newBalance,
      },
    });

    localStorage.setItem(storageKey, JSON.stringify(newStake));
    setActiveStake(newStake);
    setMessage(`Successfully staked ${currentTier.amount.toLocaleString()} $PYRA in Level ${currentTier.level}!`);
  };

  // Handle Claim Action
  const handleClaim = () => {
    if (!activeStake) return;

    const timeSinceLastClaim = currentTime - activeStake.lastClaimedAt;
    if (timeSinceLastClaim < CLAIM_COOLDOWN_MS) {
      setMessage("Daily reward is not ready yet. Please wait for cooldown.");
      return;
    }

    const tier =
      STAKING_TIERS.find((t) => t.level === activeStake.level) ?? STAKING_TIERS[0];

    const newBalance = userBalance.add(tier.dailyPyra);
    const newInventory = { ...state.inventory };

    Object.entries(tier.seeds).forEach(([seedName, count]) => {
      if (count && count > 0) {
        const currentCount =
          newInventory[seedName as InventoryItemName] ?? new Decimal(0);
        newInventory[seedName as InventoryItemName] = currentCount.add(count);
      }
    });

    gameService.send("UPDATE", {
      state: {
        ...state,
        balance: newBalance,
        inventory: newInventory,
      },
    });

    const updatedStake: ActiveStake = {
      ...activeStake,
      lastClaimedAt: Date.now(),
    };

    localStorage.setItem(storageKey, JSON.stringify(updatedStake));
    setActiveStake(updatedStake);
    setMessage(`Claimed +${tier.dailyPyra} $PYRA and high-tier seeds!`);
  };

  // Handle Unstake Action - Strictly blocked if lock period has not passed
  const handleUnstake = () => {
    if (!activeStake) return;

    // Strict validation: early unstake is forbidden
    if (currentTime < activeStake.lockUntil) {
      setMessage("Tokens are strictly locked until maturity. Unstaking early is not allowed.");
      return;
    }

    const newBalance = userBalance.add(activeStake.amount);

    gameService.send("UPDATE", {
      state: {
        ...state,
        balance: newBalance,
      },
    });

    localStorage.removeItem(storageKey);
    setActiveStake(null);
    setMessage(`Successfully unstaked ${activeStake.amount.toLocaleString()} $PYRA back to your farm!`);
  };

  const isLockActive = activeStake ? currentTime < activeStake.lockUntil : false;
  const lockTimeRemaining = activeStake
    ? Math.max(0, activeStake.lockUntil - currentTime)
    : 0;

  const nextClaimTimeRemaining = activeStake
    ? Math.max(0, CLAIM_COOLDOWN_MS - (currentTime - activeStake.lastClaimedAt))
    : 0;
  const canClaim = activeStake ? nextClaimTimeRemaining === 0 : false;

  return (
    <div className="flex flex-col space-y-2 p-1 text-xs">
      {/* Header Balance Banner */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          <Label type="default" icon={harvestIcon}>
            Tiered Staking Vault
          </Label>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xxs">Farm Balance:</span>
          <Label type="formula" icon={tokenIcon}>
            {formatNumber(userBalance, { decimalPlaces: 2 })} $PYRA
          </Label>
        </div>
      </div>

      {message && (
        <InnerPanel className="p-1 text-center text-xxs font-bold">
          <span>{message}</span>
        </InnerPanel>
      )}

      {/* ACTIVE STAKE VIEW */}
      {activeStake ? (
        <div className="flex flex-col space-y-2">
          {/* Active Vault Card */}
          <InnerPanel className="p-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Label type="vibrant">
                  Level {currentTier.level}: {currentTier.name}
                </Label>
              </div>
              <Label
                type={isLockActive ? "danger" : "success"}
                icon={isLockActive ? lockIcon : undefined}
              >
                {isLockActive ? "STRICTLY LOCKED" : "UNLOCKED"}
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xxs pt-1">
              <div className="bg-brown-600/30 p-1.5 rounded">
                <span className="text-gray-300 block">Staked Amount:</span>
                <span className="font-bold text-sm text-yellow-300">
                  {activeStake.amount.toLocaleString()} $PYRA
                </span>
              </div>
              <div className="bg-brown-600/30 p-1.5 rounded">
                <span className="text-gray-300 block">Annual Rate:</span>
                <span className="font-bold text-sm text-green-400">
                  {currentTier.apyPercent}% APY
                </span>
              </div>
            </div>

            {/* Lock Status & Timer */}
            <div className="bg-brown-600/40 p-2 rounded flex flex-col space-y-1">
              <div className="flex items-center justify-between text-xxs">
                <span className="text-gray-300 flex items-center gap-1">
                  <img src={lockIcon} className="w-3 h-3" alt="lock" />
                  Maturity Countdown:
                </span>
                <span className="font-bold">
                  {isLockActive ? formatDuration(lockTimeRemaining) : "Matured"}
                </span>
              </div>
              <p className="text-xxs text-gray-300 leading-tight">
                {isLockActive
                  ? "Tokens are strictly locked to protect the ecosystem. Unstaking will unlock when the countdown reaches zero."
                  : "Maturity reached! You may now withdraw your staked tokens anytime without penalty."}
              </p>
            </div>

            {/* Daily Rewards Card */}
            <div className="bg-brown-600/40 p-2 rounded space-y-1.5">
              <div className="flex items-center justify-between text-xxs">
                <span className="font-bold">Daily Yield (Every 24h):</span>
                <span className="text-green-400 font-bold">
                  +{currentTier.dailyPyra} $PYRA
                </span>
              </div>

              {/* Seed bonuses */}
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(currentTier.seeds).map(([seedName, count]) => {
                  const seedImage =
                    ITEM_DETAILS[seedName as InventoryItemName]?.image;
                  return (
                    <div
                      key={seedName}
                      className="flex items-center gap-1 bg-brown-700/60 px-1.5 py-0.5 rounded text-xxs"
                    >
                      {seedImage && (
                        <img src={seedImage} className="w-4 h-4" alt={seedName} />
                      )}
                      <span>
                        +{count} {seedName}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1">
                <Button
                  disabled={!canClaim}
                  onClick={handleClaim}
                  className="w-full text-xxs py-1"
                >
                  {canClaim
                    ? "Claim Daily Reward"
                    : `Next Claim in ${formatDuration(nextClaimTimeRemaining)}`}
                </Button>
              </div>
            </div>
          </InnerPanel>

          {/* Strict Unstake Button */}
          <Button
            disabled={isLockActive}
            onClick={handleUnstake}
            className="w-full"
          >
            {isLockActive
              ? `Locked (${formatDuration(lockTimeRemaining)} remaining)`
              : `Unstake Principal (${activeStake.amount.toLocaleString()} $PYRA)`}
          </Button>
        </div>
      ) : (
        /* TIER SELECTION & STAKE VIEW */
        <div className="flex flex-col space-y-2">
          {/* Level Tabs */}
          <div className="grid grid-cols-4 gap-1">
            {STAKING_TIERS.map((tier) => {
              const isSelected = selectedLevel === tier.level;
              return (
                <button
                  key={tier.level}
                  type="button"
                  onClick={() => {
                    setSelectedLevel(tier.level);
                    setMessage(null);
                  }}
                  className={`p-1.5 text-center rounded border transition-colors ${
                    isSelected
                      ? "bg-yellow-700 border-yellow-300 font-bold text-white"
                      : "bg-brown-700/50 border-brown-600 text-gray-300 hover:bg-brown-700"
                  }`}
                >
                  <div className="text-xxs uppercase">Lvl {tier.level}</div>
                  <div className="text-xxs font-bold truncate">{tier.name}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Tier Details Panel */}
          <InnerPanel className="p-2 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs">
                  Level {currentTier.level}: {currentTier.name}
                </span>
                <span className="block text-xxs text-gray-300">
                  Lock Duration: {currentTier.lockDays} Days
                </span>
              </div>
              <Label type="success">{currentTier.apyPercent}% APY</Label>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xxs">
              <div className="bg-brown-600/30 p-1.5 rounded">
                <span className="text-gray-300 block">Stake Requirement:</span>
                <span className="font-bold text-yellow-300 text-xs">
                  {currentTier.amount.toLocaleString()} $PYRA
                </span>
              </div>
              <div className="bg-brown-600/30 p-1.5 rounded">
                <span className="text-gray-300 block">Daily Token Yield:</span>
                <span className="font-bold text-green-400 text-xs">
                  +{currentTier.dailyPyra} $PYRA / day
                </span>
              </div>
            </div>

            {/* Guaranteed High-Tier Seeds Rewards */}
            <div className="bg-brown-600/40 p-2 rounded space-y-1">
              <span className="font-bold text-xxs block">
                Daily Bonus High-Tier Seeds (Guaranteed):
              </span>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {Object.entries(currentTier.seeds).map(([seedName, count]) => {
                  const seedImage =
                    ITEM_DETAILS[seedName as InventoryItemName]?.image;
                  return (
                    <div
                      key={seedName}
                      className="flex items-center gap-1 bg-brown-700/70 px-2 py-1 rounded text-xxs border border-brown-500"
                    >
                      {seedImage && (
                        <img src={seedImage} className="w-5 h-5" alt={seedName} />
                      )}
                      <span className="font-bold">
                        +{count} {seedName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lock Notice */}
            <div className="flex items-start gap-1.5 bg-yellow-950/40 border border-yellow-700/50 p-1.5 rounded text-xxs text-gray-200">
              <img src={lockIcon} className="w-3.5 h-3.5 mt-0.5" alt="lock" />
              <p className="leading-tight">
                Strict Lock Period: Tokens will be locked for {currentTier.lockDays}{" "}
                days. Early unstaking is strictly prohibited to maintain ecosystem
                stability.
              </p>
            </div>
          </InnerPanel>

          {/* Stake CTA Button */}
          <Button
            disabled={userBalance.lessThan(currentTier.amount)}
            onClick={handleStake}
            className="w-full"
          >
            {userBalance.lessThan(currentTier.amount)
              ? `Insufficient $PYRA (Requires ${currentTier.amount.toLocaleString()})`
              : `Stake ${currentTier.amount.toLocaleString()} $PYRA`}
          </Button>
        </div>
      )}
    </div>
  );
};
