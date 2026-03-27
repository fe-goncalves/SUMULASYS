import localforage from 'localforage';

const STORAGE_KEY = 'app_data_v1';

interface Team {
  id: string;
  fullname: string;
  shortname: string;
  logotype: string | null;
}

interface Athlete {
  id: string;
  fullname: string;
  surname: string;
  date_of_birth: string;
  team_id: string;
}

interface CommitteeMember {
  id: string;
  fullname: string;
  surname: string;
  team_id: string;
}

interface Tournament {
  id: string;
  fullname: string;
  shortname: string;
  season: string;
  logotype: string | null;
  main_color: string;
}

interface Match {
  id: string;
  code: string;
  tournament_id: string;
  team_a_id: string;
  team_b_id: string;
  phase: string;
  round: string;
  date: string;
}

interface AppData {
  teams: Team[];
  athletes: Athlete[];
  committee: CommitteeMember[];
  tournaments: Tournament[];
  matches: Match[];
}

const initialData: AppData = {
  teams: [],
  athletes: [],
  committee: [],
  tournaments: [],
  matches: []
};

async function loadData(): Promise<AppData> {
  try {
    const data = await localforage.getItem<AppData>(STORAGE_KEY);
    if (data) {
      return {
        teams: data.teams || [],
        athletes: data.athletes || [],
        committee: data.committee || [],
        tournaments: data.tournaments || [],
        matches: data.matches || []
      };
    }
    
    // Attempt migration from localStorage
    const oldData = localStorage.getItem(STORAGE_KEY);
    if (oldData) {
      const parsed = JSON.parse(oldData) as AppData;
      const merged = {
        teams: parsed.teams || [],
        athletes: parsed.athletes || [],
        committee: parsed.committee || [],
        tournaments: parsed.tournaments || [],
        matches: parsed.matches || []
      };
      await localforage.setItem(STORAGE_KEY, merged);
      return merged;
    }
  } catch (error) {
    console.error('Error loading data from localforage:', error);
  }
  return initialData;
}

async function saveData(data: AppData): Promise<void> {
  try {
    await localforage.setItem(STORAGE_KEY, data);
  } catch (error) {
    console.error('Error saving data to localforage:', error);
    throw error;
  }
}

export const storage = {
  // Teams
  getTeams: async () => (await loadData()).teams,
  getTeam: async (id: string) => {
    const data = await loadData();
    const team = data.teams.find(t => t.id === id);
    if (!team) return null;
    
    const athletes = data.athletes.filter(a => a.team_id === id);
    const committee = data.committee.filter(c => c.team_id === id);
    
    return { ...team, athletes, committee };
  },
  createTeam: async (team: Team) => {
    const data = await loadData();
    if (data.teams.find(t => t.id === team.id)) throw new Error('Team ID already exists');
    data.teams.push(team);
    await saveData(data);
    return team;
  },
  updateTeam: async (id: string, updates: Partial<Team>) => {
    const data = await loadData();
    const index = data.teams.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Team not found');
    data.teams[index] = { ...data.teams[index], ...updates };
    await saveData(data);
    return data.teams[index];
  },
  deleteTeam: async (id: string) => {
    const data = await loadData();
    data.teams = data.teams.filter(t => t.id !== id);
    data.athletes = data.athletes.filter(a => a.team_id !== id);
    data.committee = data.committee.filter(c => c.team_id !== id);
    data.matches = data.matches.filter(m => m.team_a_id !== id && m.team_b_id !== id);
    await saveData(data);
  },

  // Athletes
  getAthletes: async () => {
    const data = await loadData();
    return data.athletes.map(a => {
      const team = data.teams.find(t => t.id === a.team_id);
      return {
        ...a,
        team_name: team?.fullname,
        team_shortname: team?.shortname,
        team_logotype: team?.logotype
      };
    });
  },
  createAthlete: async (athlete: Athlete) => {
    const data = await loadData();
    if (data.athletes.find(a => a.id === athlete.id)) throw new Error('Athlete with this ID already exists.');
    data.athletes.push(athlete);
    await saveData(data);
    return athlete;
  },
  updateAthlete: async (id: string, updates: Partial<Athlete>) => {
    const data = await loadData();
    if (updates.id && updates.id !== id && data.athletes.find(a => a.id === updates.id)) {
        throw new Error('Athlete with this ID already exists.');
    }
    const index = data.athletes.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Athlete not found');
    data.athletes[index] = { ...data.athletes[index], ...updates };
    await saveData(data);
    return data.athletes[index];
  },
  deleteAthlete: async (id: string) => {
    const data = await loadData();
    data.athletes = data.athletes.filter(a => a.id !== id);
    await saveData(data);
  },

  // Committee
  getCommittee: async () => {
    const data = await loadData();
    return data.committee.map(c => {
      const team = data.teams.find(t => t.id === c.team_id);
      return {
        ...c,
        team_name: team?.fullname,
        team_shortname: team?.shortname,
        team_logotype: team?.logotype
      };
    });
  },
  createCommittee: async (member: CommitteeMember) => {
    const data = await loadData();
    if (data.committee.find(c => c.id === member.id)) throw new Error('Member with this ID already exists.');
    data.committee.push(member);
    await saveData(data);
    return member;
  },
  updateCommittee: async (id: string, updates: Partial<CommitteeMember>) => {
    const data = await loadData();
    if (updates.id && updates.id !== id && data.committee.find(c => c.id === updates.id)) {
        throw new Error('Member with this ID already exists.');
    }
    const index = data.committee.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Member not found');
    data.committee[index] = { ...data.committee[index], ...updates };
    await saveData(data);
    return data.committee[index];
  },
  deleteCommittee: async (id: string) => {
    const data = await loadData();
    data.committee = data.committee.filter(c => c.id !== id);
    await saveData(data);
  },

  // Tournaments
  getTournaments: async () => (await loadData()).tournaments,
  getTournament: async (id: string) => {
      const data = await loadData();
      const tournament = data.tournaments.find(t => t.id === id);
      if (!tournament) return null;
      
      const matches = data.matches
        .filter(m => m.tournament_id === id)
        .map(m => {
            const teamA = data.teams.find(t => t.id === m.team_a_id);
            const teamB = data.teams.find(t => t.id === m.team_b_id);
            return {
                ...m,
                team_a_name: teamA?.fullname,
                team_a_shortname: teamA?.shortname,
                team_a_logotype: teamA?.logotype,
                team_b_name: teamB?.fullname,
                team_b_shortname: teamB?.shortname,
                team_b_logotype: teamB?.logotype,
            };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return { ...tournament, matches };
  },
  createTournament: async (tournament: Tournament) => {
    const data = await loadData();
    if (data.tournaments.find(t => t.id === tournament.id)) throw new Error('Tournament ID already exists');
    data.tournaments.push(tournament);
    await saveData(data);
    return tournament;
  },
  updateTournament: async (id: string, updates: Partial<Tournament>) => {
    const data = await loadData();
    const index = data.tournaments.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tournament not found');
    data.tournaments[index] = { ...data.tournaments[index], ...updates };
    await saveData(data);
    return data.tournaments[index];
  },
  deleteTournament: async (id: string) => {
    const data = await loadData();
    data.tournaments = data.tournaments.filter(t => t.id !== id);
    data.matches = data.matches.filter(m => m.tournament_id !== id);
    await saveData(data);
  },

  // Matches
  getMatches: async () => {
    const data = await loadData();
    return data.matches.map(m => {
      const tournament = data.tournaments.find(t => t.id === m.tournament_id);
      const teamA = data.teams.find(t => t.id === m.team_a_id);
      const teamB = data.teams.find(t => t.id === m.team_b_id);
      return {
        ...m,
        tournament_name: tournament?.fullname,
        tournament_logotype: tournament?.logotype,
        team_a_name: teamA?.fullname,
        team_a_shortname: teamA?.shortname,
        team_a_logotype: teamA?.logotype,
        team_b_name: teamB?.fullname,
        team_b_shortname: teamB?.shortname,
        team_b_logotype: teamB?.logotype,
      };
    });
  },
  getMatch: async (id: string) => {
    const data = await loadData();
    const m = data.matches.find(m => m.id === id);
    if (!m) return null;
    
    const tournament = data.tournaments.find(t => t.id === m.tournament_id);
    const teamA = data.teams.find(t => t.id === m.team_a_id);
    const teamB = data.teams.find(t => t.id === m.team_b_id);
    
    // Get athletes and committee for teams
    const teamAAthletes = data.athletes.filter(a => a.team_id === teamA?.id);
    const teamBAthletes = data.athletes.filter(a => a.team_id === teamB?.id);
    const teamACommittee = data.committee.filter(c => c.team_id === teamA?.id);
    const teamBCommittee = data.committee.filter(c => c.team_id === teamB?.id);

    return {
        ...m,
        tournament_name: tournament?.fullname,
        tournament_logotype: tournament?.logotype,
        tournament_main_color: tournament?.main_color,
        team_a_name: teamA?.fullname,
        team_a_shortname: teamA?.shortname,
        team_a_logotype: teamA?.logotype,
        team_b_name: teamB?.fullname,
        team_b_shortname: teamB?.shortname,
        team_b_logotype: teamB?.logotype,
        team_a: { ...teamA, athletes: teamAAthletes, committee: teamACommittee },
        team_b: { ...teamB, athletes: teamBAthletes, committee: teamBCommittee }
    };
  },
  createMatch: async (matchData: any) => {
    const data = await loadData();
    // Find max game number to avoid collisions
    let maxNum = 0;
    data.matches.forEach(m => {
        const match = m.id.match(/GAME (\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
        }
    });
    const nextNum = maxNum + 1;
    const id = `GAME ${nextNum}`;
    const newMatch = { ...matchData, id, code: id };
    data.matches.push(newMatch);
    await saveData(data);
    return newMatch;
  },
  updateMatch: async (id: string, updates: Partial<Match>) => {
    const data = await loadData();
    const index = data.matches.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Match not found');
    data.matches[index] = { ...data.matches[index], ...updates };
    await saveData(data);
    return data.matches[index];
  },
  deleteMatch: async (id: string) => {
    const data = await loadData();
    data.matches = data.matches.filter(m => m.id !== id);
    await saveData(data);
  },

  // Backup/Restore
  getBackup: async () => await loadData(),
  restoreBackup: async (backupData: AppData) => {
      await saveData(backupData);
  },
  migrateData: async () => {
    try {
      const oldData = localStorage.getItem(STORAGE_KEY);
      if (oldData) {
        const parsed = JSON.parse(oldData) as AppData;
        const merged = {
          teams: parsed.teams || [],
          athletes: parsed.athletes || [],
          committee: parsed.committee || [],
          tournaments: parsed.tournaments || [],
          matches: parsed.matches || []
        };
        await localforage.setItem(STORAGE_KEY, merged);
        console.log('Data successfully migrated from localStorage to localforage');
        return true;
      }
    } catch (error) {
      console.error('Error during data migration:', error);
    }
    return false;
  }
};