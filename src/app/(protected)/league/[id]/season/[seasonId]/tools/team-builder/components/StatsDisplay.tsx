'use client';

type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  atk: 'Attack',
  def: 'Defense',
  spa: 'Sp. Atk',
  spd: 'Sp. Def',
  spe: 'Speed',
};

const STAT_COLORS: Record<StatKey, string> = {
  hp: 'from-red-500 to-red-600',
  atk: 'from-orange-500 to-orange-600',
  def: 'from-yellow-500 to-yellow-600',
  spa: 'from-blue-500 to-blue-600',
  spd: 'from-pink-500 to-pink-600',
  spe: 'from-green-500 to-green-600',
};

interface StatsDisplayProps {
  baseStats: Record<StatKey, number>;
  evs: Record<StatKey, number>;
  ivs?: Record<StatKey, number>;
  nature?: string;
  onStatsClick: () => void;
}

/**
 * Calculates final stat based on Pokemon formula
 * Formula: ((2 * base + IV + EV/4) * level / 100 + 5)
 */
function calculateStat(
  base: number,
  iv: number = 31,
  ev: number = 0,
  statKey: StatKey,
  level: number = 100
): number {
  const natureMultiplier = 1; // Could be applied if parsing nature boost
  const raw = ((2 * base + iv + Math.floor(ev / 4)) * level) / 100 + 5;
  return Math.floor(raw * natureMultiplier);
}

export function StatsDisplay({
  baseStats,
  evs,
  ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  nature = '',
  onStatsClick,
}: StatsDisplayProps) {
  const maxStatValue = 150; // For scaling the visual bars

  return (
    <button
      onClick={onStatsClick}
      className="w-full cursor-pointer space-y-4 rounded-lg border border-border/50 bg-background/30 p-4 transition-colors hover:bg-background/60 hover:border-border"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Stats</h3>
        <span className="text-xs text-muted-foreground">Click to edit</span>
      </div>

      <div className="space-y-3">
        {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map((key) => {
          const base = baseStats[key] || 0;
          const ev = evs[key] || 0;
          const iv = ivs[key] || 31;
          const finalStat = calculateStat(base, iv, ev, key);
          const barWidth = Math.min(100, (finalStat / maxStatValue) * 100);

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium uppercase tracking-widest text-muted-foreground">
                  {STAT_LABELS[key]}
                </span>
                <span className="font-semibold text-foreground">{finalStat}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${STAT_COLORS[key]} transition-all duration-300`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {nature && (
        <div className="mt-3 border-t pt-3 text-left">
          <p className="text-xs text-muted-foreground">
            Nature: <span className="font-medium text-foreground">{nature}</span>
          </p>
        </div>
      )}
    </button>
  );
}