import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Minus, RotateCcw, X, Edit2, Check, Undo2 } from 'lucide-react';
import { useState } from 'react';
import type { Counter } from '../types/knitting';

interface CounterWidgetProps {
  counter: Counter;
  onUpdate: (counter: Counter) => void;
  onRemove: (id: string) => void;
}

export function CounterWidget({ counter, onUpdate, onRemove }: CounterWidgetProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editLabel, setEditLabel] = useState(counter.label);

  const updateCount = (newCount: number) => {
    onUpdate({ ...counter, count: Math.max(0, newCount), previousCount: counter.count });
  };

  const increment = (amount: number = 1) => {
    updateCount(counter.count + amount);
  };

  const decrement = (amount: number = 1) => {
    updateCount(counter.count - amount);
  };

  const reset = () => {
    onUpdate({ ...counter, count: 0, previousCount: counter.count });
  };

  const undo = () => {
    if (counter.previousCount != null) {
      onUpdate({ ...counter, count: counter.previousCount, previousCount: undefined });
    }
  };

  const saveLabel = () => {
    if (editLabel.trim()) {
      onUpdate({ ...counter, label: editLabel.trim() });
    }
    setIsEditingLabel(false);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        {isEditingLabel ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveLabel();
                if (e.key === 'Escape') {
                  setEditLabel(counter.label);
                  setIsEditingLabel(false);
                }
              }}
              className="max-w-[200px]"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={saveLabel}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Label className="text-lg text-purple-900 dark:text-purple-100">
              {counter.label}
            </Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditingLabel(true)}
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(counter.id)}
          className="text-destructive hover:text-destructive h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            onClick={() => decrement(1)}
            className="h-16 w-16 rounded-full bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 shadow-md active:scale-95 transition-transform"
          >
            <Minus className="h-8 w-8" />
          </Button>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => decrement(5)}
              className="h-7 px-2 text-xs border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/50"
            >
              -5
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => decrement(10)}
              className="h-7 px-2 text-xs border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/50"
            >
              -10
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl px-8 py-6 min-w-[140px] text-center shadow-inner border-2 border-purple-200 dark:border-purple-700">
          <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
            {counter.count}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            onClick={() => increment(1)}
            className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-md active:scale-95 transition-transform"
          >
            <Plus className="h-8 w-8" />
          </Button>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => increment(5)}
              className="h-7 px-2 text-xs border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            >
              +5
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => increment(10)}
              className="h-7 px-2 text-xs border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            >
              +10
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {counter.previousCount != null && (
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            className="border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/50"
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Angre ({counter.previousCount})
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/50"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Tilbakestill
        </Button>
      </div>
    </div>
  );
}
