import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatTZS } from '@/data/sampleData';
import { Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
}

const defaultExpenses: Expense[] = [
  { id: '1', category: 'Venue', description: 'Wedding hall rental', amount: 2000000 },
  { id: '2', category: 'Catering', description: 'Food for 200 guests', amount: 1500000 },
  { id: '3', category: 'Photography', description: 'Photo + Video package', amount: 900000 },
  { id: '4', category: 'Decoration', description: 'Full venue decoration', amount: 800000 },
  { id: '5', category: 'MC/DJ', description: 'MC and sound system', amount: 700000 },
];

const BudgetPage = () => {
  const { t } = useLanguage();
  const [totalBudget] = useState(10000000);
  const [expenses, setExpenses] = useState<Expense[]>(defaultExpenses);
  const [showForm, setShowForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: '', description: '', amount: '' });

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalBudget - totalSpent;
  const spentPercent = Math.min((totalSpent / totalBudget) * 100, 100);

  const addExpense = () => {
    if (!newExpense.category || !newExpense.amount) return;
    setExpenses([...expenses, {
      id: Date.now().toString(),
      category: newExpense.category,
      description: newExpense.description,
      amount: parseInt(newExpense.amount),
    }]);
    setNewExpense({ category: '', description: '', amount: '' });
    setShowForm(false);
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container py-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">{t('budgetOverview')}</h1>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-5 mb-6"
        >
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-xs text-muted-foreground">{t('totalBudget')}</p>
              <p className="font-bold text-primary">{formatTZS(totalBudget)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('spent')}</p>
              <p className="font-bold text-destructive">{formatTZS(totalSpent)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('remaining')}</p>
              <p className="font-bold text-foreground">{formatTZS(remaining)}</p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gold-gradient transition-all duration-500"
              style={{ width: `${spentPercent}%` }}
            />
          </div>
        </motion.div>

        {/* Expenses */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">{t('category')}</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-lg bg-gold-gradient px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> {t('addExpense')}
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-xl border border-primary/30 bg-card p-4 mb-4 space-y-3"
          >
            <input
              placeholder={t('category')}
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder={t('description')}
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder={t('amount')}
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={addExpense} className="flex-1 rounded-lg bg-gold-gradient py-2 text-sm font-semibold text-primary-foreground">{t('save')}</button>
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium">{t('cancel')}</button>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {expenses.map((expense, i) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-medium text-sm">{expense.category}</p>
                <p className="text-xs text-muted-foreground">{expense.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm">{formatTZS(expense.amount)}</span>
                <button onClick={() => removeExpense(expense.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;
