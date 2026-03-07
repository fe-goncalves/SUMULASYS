
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

function loadData(): AppData {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : initialData;
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const storage = {
  // Teams
  getTeams: () => loadData().teams,
  getTeam: (id: string) => {
    const data = loadData();
    const team = data.teams.find(t => t.id === id);
    if (!team) return null;
    
    const athletes = data.athletes.filter(a => a.team_id === id);
    const committee = data.committee.filter(c => c.team_id === id);
    
    return { ...team, athletes, committee };
  },
  createTeam: (team: Team) => {
    const data = loadData();
    if (data.teams.find(t => t.id === team.id)) throw new Error('Team ID already exists');
    data.teams.push(team);
    saveData(data);
    return team;
  },
  updateTeam: (id: string, updates: Partial<Team>) => {
    const data = loadData();
    const index = data.teams.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Team not found');
    data.teams[index] = { ...data.teams[index], ...updates };
    saveData(data);
    return data.teams[index];
  },
  deleteTeam: (id: string) => {
    const data = loadData();
    data.teams = data.teams.filter(t => t.id !== id);
    // Cascade delete or set to null? Server implementation didn't cascade delete but frontend might expect it.
    // Let's check server.ts... server.ts didn't have explicit cascade delete in the code I saw, but SQLite might have handled it if configured.
    // Actually, server.ts code for deleteTeam was: db.prepare("DELETE FROM teams WHERE id = ?").run(req.params.id);
    // And foreign keys were defined. So it might have failed if there were dependencies, or cascaded if configured.
    // Let's assume we should clean up references to avoid broken UI.
    data.athletes = data.athletes.filter(a => a.team_id !== id);
    data.committee = data.committee.filter(c => c.team_id !== id);
    data.matches = data.matches.filter(m => m.team_a_id !== id && m.team_b_id !== id);
    saveData(data);
  },

  // Athletes
  getAthletes: () => {
    const data = loadData();
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
  createAthlete: (athlete: Athlete) => {
    const data = loadData();
    if (data.athletes.find(a => a.id === athlete.id)) throw new Error('Athlete with this ID already exists.');
    data.athletes.push(athlete);
    saveData(data);
    return athlete;
  },
  updateAthlete: (id: string, updates: Partial<Athlete>) => {
    const data = loadData();
    // Check if new ID conflicts
    if (updates.id && updates.id !== id && data.athletes.find(a => a.id === updates.id)) {
        throw new Error('Athlete with this ID already exists.');
    }
    const index = data.athletes.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Athlete not found');
    data.athletes[index] = { ...data.athletes[index], ...updates };
    saveData(data);
    return data.athletes[index];
  },
  deleteAthlete: (id: string) => {
    const data = loadData();
    data.athletes = data.athletes.filter(a => a.id !== id);
    saveData(data);
  },

  // Committee
  getCommittee: () => {
    const data = loadData();
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
  createCommittee: (member: CommitteeMember) => {
    const data = loadData();
    if (data.committee.find(c => c.id === member.id)) throw new Error('Member with this ID already exists.');
    data.committee.push(member);
    saveData(data);
    return member;
  },
  updateCommittee: (id: string, updates: Partial<CommitteeMember>) => {
    const data = loadData();
    if (updates.id && updates.id !== id && data.committee.find(c => c.id === updates.id)) {
        throw new Error('Member with this ID already exists.');
    }
    const index = data.committee.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Member not found');
    data.committee[index] = { ...data.committee[index], ...updates };
    saveData(data);
    return data.committee[index];
  },
  deleteCommittee: (id: string) => {
    const data = loadData();
    data.committee = data.committee.filter(c => c.id !== id);
    saveData(data);
  },

  // Tournaments
  getTournaments: () => loadData().tournaments,
  getTournament: (id: string) => {
      const data = loadData();
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
  createTournament: (tournament: Tournament) => {
    const data = loadData();
    if (data.tournaments.find(t => t.id === tournament.id)) throw new Error('Tournament ID already exists');
    data.tournaments.push(tournament);
    saveData(data);
    return tournament;
  },
  updateTournament: (id: string, updates: Partial<Tournament>) => {
    const data = loadData();
    const index = data.tournaments.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tournament not found');
    data.tournaments[index] = { ...data.tournaments[index], ...updates };
    saveData(data);
    return data.tournaments[index];
  },
  deleteTournament: (id: string) => {
    const data = loadData();
    data.tournaments = data.tournaments.filter(t => t.id !== id);
    data.matches = data.matches.filter(m => m.tournament_id !== id);
    saveData(data);
  },

  // Matches
  getMatches: () => {
    const data = loadData();
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
  getMatch: (id: string) => {
    const data = loadData();
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
  createMatch: (matchData: any) => {
    const data = loadData();
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
    saveData(data);
    return newMatch;
  },
  updateMatch: (id: string, updates: Partial<Match>) => {
    const data = loadData();
    const index = data.matches.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Match not found');
    data.matches[index] = { ...data.matches[index], ...updates };
    saveData(data);
    return data.matches[index];
  },
  deleteMatch: (id: string) => {
    const data = loadData();
    data.matches = data.matches.filter(m => m.id !== id);
    saveData(data);
  },

  // Backup/Restore
  getBackup: () => loadData(),
  restoreBackup: (backupData: AppData) => {
      saveData(backupData);
  }
};
