import React, { useContext, useEffect, useState } from "react";
import { useSelector } from "@xstate/react";
import Decimal from "decimal.js-light";
import { Modal } from "components/ui/Modal";
import { CloseButtonPanel } from "features/game/components/CloseablePanel";
import { InnerPanel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { Context } from "features/game/GameProvider";
import type { MachineState } from "features/game/lib/gameMachine";
import type { InventoryItemName } from "features/game/types/game";
import { ITEM_DETAILS } from "features/game/types/images";

import calendarIcon from "assets/icons/calendar.webp";
import giftIcon from "assets/icons/gift.png";
import lockIcon from "assets/icons/lock.png";
import tokenIcon from "assets/icons/token.png";
import { SUNNYSIDE } from "assets/sunnyside";

interface DailyReward {
  day: number;
  label: string;
  seeds: Partial<Record<InventoryItemName, number>>;
  pyra?: number;
}

export const DAILY_STREAK_REWARDS: DailyReward[] = [
  {
    day: 1,
    label: "Day 1",
    seeds: { "Sunflower Seed": 20 },
  },
  {
    day: 2,
    label: "Day 2",
    seeds: { "Potato Seed": 15 },
  },
  {
    day: 3,
    label: "Day 3",
    seeds: { "Carrot Seed": 10, "Sprout Mix": 1 },
  },
  {
    day: 4,
    label: "Day 4",
    seeds: { "Cabbage Seed": 10 },
  },
  {
    day: 5,
    label: "Day 5",
    seeds: { "Beetroot Seed": 10, "Sprout Mix": 2 },
  },
  {
    day: 6,
    label: "Day 6",
    seeds: { "Cauliflower Seed": 10 },
  },
  {
    day: 7,
    label: "Day 7 (Grand)",
    seeds: { "Parsnip Seed": 15, "Radish Seed": 10 },
    pyra: 2.0,
  },
];

interface StreakState {
  currentDay: number; // 1 to 7
  lastClaimDateString: string; // YYYY-MM-DD
}

const _state = (state: MachineState) => state.context.state;
const _farmId = (state: MachineState) => state.context.farmId;

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isDailyRewardAvailable(farmId?: number): boolean {
  try {
    const key = `pyra_daily_streak_${farmId ?? "default"}`;
    const stored = localStorage.getItem(key);
    if (!stored) return true;
    const parsed = JSON.parse(stored) as StreakState;
    return parsed.lastClaimDateString !== getTodayString();
  } catch (e) {
    return true;
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyStreakModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { gameService } = useContext(Context);
  const state = useSelector(gameService, _state);
  const farmId = useSelector(gameService, _farmId);

  const storageKey = `pyra_daily_streak_${farmId ?? "default"}`;
  const [streak, setStreak] = useState<StreakState>({
    currentDay: 1,
    lastClaimDateString: "",
  });
  const [claimedToday, setClaimedToday] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const today = getTodayString();
      if (stored) {
        const parsed = JSON.parse(stored) as StreakState;
        setStreak(parsed);
        setClaimedToday(parsed.lastClaimDateString === today);
      } else {
        setStreak({ currentDay: 1, lastClaimDateString: "" });
        setClaimedToday(false);
      }
    } catch (e) {
      // ignore
    }
  }, [storageKey, isOpen]);

  const handleClaim = () => {
    if (claimedToday) return;

    const todayReward =
      DAILY_STREAK_REWARDS.find((r) => r.day === streak.currentDay) ??
      DAILY_STREAK_REWARDS[0];

    const newInventory = { ...state.inventory };
    Object.entries(todayReward.seeds).forEach(([item, count]) => {
      if (count && count > 0) {
        const existing =
          newInventory[item as InventoryItemName] ?? new Decimal(0);
        newInventory[item as InventoryItemName] = existing.add(count);
      }
    });

    let newBalance = state.balance ?? new Decimal(0);
    if (todayReward.pyra && todayReward.pyra > 0) {
      newBalance = newBalance.add(todayReward.pyra);
    }

    gameService.send("UPDATE", {
      state: {
        ...state,
        balance: newBalance,
        inventory: newInventory,
      },
    });

    const nextDay = streak.currentDay >= 7 ? 1 : streak.currentDay + 1;
    const updatedStreak: StreakState = {
      currentDay: nextDay,
      lastClaimDateString: getTodayString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(updatedStreak));
    setStreak(updatedStreak);
    setClaimedToday(true);
    setFeedback(`Claimed Day ${todayReward.day} bonus! Come back tomorrow for Day ${nextDay}!`);
  };

  const activeReward =
    DAILY_STREAK_REWARDS.find(
      (r) =>
        r.day ===
        (claimedToday
          ? streak.currentDay === 1
            ? 7
            : streak.currentDay - 1
          : streak.currentDay),
    ) ?? DAILY_STREAK_REWARDS[0];

  return (
    <Modal show={isOpen} onHide={onClose}>
      <CloseButtonPanel title="Daily Harvest Streak" onClose={onClose}>
        <div className="flex flex-col space-y-2 p-1 text-xs">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Label type="default" icon={calendarIcon}>
              7-Day Login Calendar
            </Label>
            <Label type={claimedToday ? "success" : "vibrant"} icon={giftIcon}>
              {claimedToday ? "Completed for Today" : "Reward Ready"}
            </Label>
          </div>

          <p className="text-xxs text-gray-200">
            Log in daily to claim free high-tier crop seeds, fertilizers, and $PYRA bonuses. Complete all 7 days to unlock the Grand Harvest Box!
          </p>

          {feedback && (
            <InnerPanel className="p-1 text-center text-xxs font-bold text-yellow-300">
              <span>{feedback}</span>
            </InnerPanel>
          )}

          {/* 7 Days Grid */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {DAILY_STREAK_REWARDS.map((reward) => {
              const isGrand = reward.day === 7;
              const isPastClaimed =
                claimedToday
                  ? reward.day <=
                    (streak.currentDay === 1 ? 7 : streak.currentDay - 1)
                  : reward.day < streak.currentDay;
              const isTodayActive =
                !claimedToday && reward.day === streak.currentDay;

              return (
                <div
                  key={reward.day}
                  className={`relative p-1.5 rounded flex flex-col items-center justify-between border ${
                    isGrand ? "col-span-2 bg-yellow-950/40 border-yellow-400" : ""
                  } ${
                    isTodayActive
                      ? "bg-yellow-700/60 border-yellow-300 ring-2 ring-yellow-400/50"
                      : isPastClaimed
                      ? "bg-green-950/40 border-green-600 opacity-80"
                      : "bg-brown-800/60 border-brown-600 opacity-60"
                  }`}
                >
                  <span className="font-bold text-xxs block text-gray-200">
                    {reward.label}
                  </span>

                  {/* Seed & Reward Icons */}
                  <div className="flex flex-wrap items-center justify-center gap-1 my-1">
                    {Object.entries(reward.seeds).map(([item, count]) => {
                      const img = ITEM_DETAILS[item as InventoryItemName]?.image;
                      return (
                        <div
                          key={item}
                          className="flex flex-col items-center"
                          title={`${count}x ${item}`}
                        >
                          {img && <img src={img} className="w-5 h-5" alt={item} />}
                          <span className="text-xxs font-bold text-yellow-300">
                            +{count}
                          </span>
                        </div>
                      );
                    })}

                    {reward.pyra && (
                      <div
                        className="flex flex-col items-center"
                        title={`+${reward.pyra} $PYRA`}
                      >
                        <img src={tokenIcon} className="w-5 h-5" alt="PYRA" />
                        <span className="text-xxs font-bold text-green-300">
                          +{reward.pyra}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  {isPastClaimed ? (
                    <span className="text-xxs text-green-400 font-bold flex items-center gap-0.5">
                      Claimed
                    </span>
                  ) : isTodayActive ? (
                    <span className="text-xxs text-yellow-300 font-bold animate-pulse">
                      Ready
                    </span>
                  ) : (
                    <span className="text-xxs text-gray-400 flex items-center gap-0.5">
                      <img src={lockIcon} className="w-2.5 h-2.5" alt="lock" />
                      Locked
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Claim Button */}
          <div className="pt-1">
            <Button
              disabled={claimedToday}
              onClick={handleClaim}
              className="w-full text-xs py-1.5"
            >
              {claimedToday
                ? "Reward Claimed Today (Next Reset Tomorrow)"
                : `Claim Day ${streak.currentDay} Reward`}
            </Button>
          </div>
        </div>
      </CloseButtonPanel>
    </Modal>
  );
};
