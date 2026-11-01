import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    const error = new Error('Activity payload is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (typeof userId !== 'string' || !mongoose.isObjectIdOrHexString(userId)) {
    const error = new Error('userId must be a valid user ID');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  if (typeof teamId !== 'string' || !mongoose.isObjectIdOrHexString(teamId)) {
    const error = new Error('teamId must be a valid team ID');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  if (typeof type !== 'string' || !type.trim()) {
    const error = new Error('type is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  if (typeof minutes !== 'number' || Number.isNaN(minutes) || minutes <= 0) {
    const error = new Error('minutes must be a positive number');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  const team = await Team.findById(teamId);
  if (!team) {
    const error = new Error('Team not found');
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    const error = new Error('Team payload is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim()) {
    const error = new Error('name is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    const error = new Error('mascot is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isObjectIdOrHexString(member))) {
    const error = new Error('members must be an array of valid user IDs');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const foundMembers = await User.find({ _id: { $in: members } }).select('_id').lean();
  if (foundMembers.length !== new Set(members).size) {
    const error = new Error('One or more team members were not found');
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: foundMembers.map(({ _id }) => _id),
  });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map(({ _id, name }) => ({
      teamName: name,
      totalPoints: pointsByTeam.get(_id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('_id fitnessGoal').lean();
  if (!user) {
    const error = new Error('User not found');
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  const [workouts, activities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).select('type').lean(),
  ]);
  const goal = user.fitnessGoal.toLowerCase();
  const activityFocus = new Map<string, string>([
    ['run', 'endurance'],
    ['cycle', 'endurance'],
    ['cycling', 'endurance'],
    ['strength', 'strength'],
  ]);
  const recentFocuses = activities.map(({ type }) => activityFocus.get(type.toLowerCase()) ?? type.toLowerCase());

  return workouts
    .map((workout) => {
      const focus = workout.focus.toLowerCase();
      const matchesGoal = focus === goal;
      const matchingActivityIndex = recentFocuses.indexOf(focus);
      const matchesActivity = matchingActivityIndex !== -1;
      const reason = matchesGoal && matchesActivity
        ? `Recommended to support your ${workout.focus} goal and recent ${activities[matchingActivityIndex].type} activity.`
        : matchesGoal
          ? `Recommended because it matches your ${workout.focus} fitness goal.`
          : matchesActivity
            ? `Recommended based on your recent ${activities[matchingActivityIndex].type} activity.`
            : 'Recommended as a complementary option to diversify your training.';
      return {
        ...workout,
        reason,
        score: Number(matchesGoal) * 2 + recentFocuses.filter((recentFocus) => recentFocus === focus).length,
      };
    })
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .map(({ score: _score, ...workout }) => workout);
}

export { User };
