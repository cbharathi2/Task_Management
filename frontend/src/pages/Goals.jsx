import React, { useState, useEffect } from 'react';
import { goalService } from '../services/goalService';
import CreateGoalModal from '../components/Modals/CreateGoalModal';
import GoalCard from '../components/GoalCard';
import { FiPlus } from 'react-icons/fi';

const Goals = () => {
  const [myGoals, setMyGoals] = useState([]);
  const [teamGoals, setTeamGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [createTeamGoalOpen, setCreateTeamGoalOpen] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const [myRes, teamRes] = await Promise.all([
        goalService.getMyGoals(),
        goalService.getTeamGoals(),
      ]);
      setMyGoals(myRes.data.goals || []);
      setTeamGoals(teamRes.data.goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async (goalId, type) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await goalService.deleteGoal(goalId);
        if (type === 'personal') {
          setMyGoals(myGoals.filter((g) => g.id !== goalId));
        } else {
          setTeamGoals(teamGoals.filter((g) => g.id !== goalId));
        }
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-text-secondary">Loading...</div>;
  }

  return (
    <div className="ml-64 pt-24 px-8 pb-12">
      <h1 className="text-4xl font-bold text-text-primary mb-8">Goals</h1>

      {/* My Goals */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-text-primary">My Goals</h2>
          <button onClick={() => setCreateGoalOpen(true)} className="btn-primary flex items-center gap-2">
            <FiPlus size={18} />
            Create Goal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={() => deleteGoal(goal.id, 'personal')}
              onRefresh={fetchGoals}
            />
          ))}
        </div>
      </div>

      {/* Team Goals */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-text-primary">Team Goals</h2>
          <button onClick={() => setCreateTeamGoalOpen(true)} className="btn-primary flex items-center gap-2">
            <FiPlus size={18} />
            Create Team Goal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              showCreator={true}
              onDelete={() => deleteGoal(goal.id, 'team')}
              onRefresh={fetchGoals}
            />
          ))}
        </div>
      </div>

      <CreateGoalModal
        isOpen={createGoalOpen}
        onClose={() => setCreateGoalOpen(false)}
        goalType="personal"
        onGoalCreated={fetchGoals}
      />

      <CreateGoalModal
        isOpen={createTeamGoalOpen}
        onClose={() => setCreateTeamGoalOpen(false)}
        goalType="team"
        onGoalCreated={fetchGoals}
      />
    </div>
  );
};

export default Goals;
