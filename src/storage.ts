import { supabase } from './supabaseClient';

interface Team {
  id: string;
  fullname: string;
  shortname: string;
  logotype: string | null;
  user_id?: string;
}

interface Athlete {
  id: string;
  fullname: string;
  surname: string;
  date_of_birth: string;
  team_id: string;
  user_id?: string;
}

interface CommitteeMember {
  id: string;
  fullname: string;
  surname: string;
  team_id: string;
  user_id?: string;
}

interface Tournament {
  id: string;
  fullname: string;
  shortname: string;
  season: string;
  logotype: string | null;
  main_color: string;
  user_id?: string;
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
  user_id?: string;
}

interface AppData {
  teams: Team[];
  athletes: Athlete[];
  committee: CommitteeMember[];
  tournaments: Tournament[];
  matches: Match[];
}

export const storage = {
  // Teams
  getTeams: async (userId: string) => {
    const { data, error } = await supabase.from('teams').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
  },
  getTeam: async (id: string) => {
    const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('id', id).single();
    if (teamError || !team) return null;
    
    const { data: athletes } = await supabase.from('athletes').select('*').eq('team_id', id);
    const { data: committee } = await supabase.from('committee').select('*').eq('team_id', id);
    
    return { ...team, athletes: athletes || [], committee: committee || [] };
  },
  createTeam: async (userId: string, team: Team) => {
    const { data, error } = await supabase.from('teams').insert([{ ...team, user_id }]).select().single();
    if (error) throw error;
    return data;
  },
  updateTeam: async (id: string, updates: Partial<Team>) => {
    const { data, error } = await supabase.from('teams').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteTeam: async (id: string) => {
    // Due to foreign keys, we might need to delete related data or rely on ON DELETE CASCADE in DB
    await supabase.from('athletes').delete().eq('team_id', id);
    await supabase.from('committee').delete().eq('team_id', id);
    await supabase.from('matches').delete().or(`team_a_id.eq.${id},team_b_id.eq.${id}`);
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) throw error;
  },

  // Athletes
  getAthletes: async (userId: string) => {
    const { data: athletes, error } = await supabase.from('athletes').select('*').eq('user_id', userId);
    if (error) throw error;
    const { data: teams } = await supabase.from('teams').select('id, fullname, shortname, logotype').eq('user_id', userId);
    
    return athletes.map(a => {
      const team = teams?.find(t => t.id === a.team_id);
      return {
        ...a,
        team_name: team?.fullname,
        team_shortname: team?.shortname,
        team_logotype: team?.logotype
      };
    });
  },
  createAthlete: async (userId: string, athlete: Athlete) => {
    const { data, error } = await supabase.from('athletes').insert([{ ...athlete, user_id: userId }]).select().single();
    if (error) throw error;
    return data;
  },
  updateAthlete: async (id: string, updates: Partial<Athlete>) => {
    const { data, error } = await supabase.from('athletes').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteAthlete: async (id: string) => {
    const { error } = await supabase.from('athletes').delete().eq('id', id);
    if (error) throw error;
  },

  // Committee
  getCommittee: async (userId: string) => {
    const { data: committee, error } = await supabase.from('committee').select('*').eq('user_id', userId);
    if (error) throw error;
    const { data: teams } = await supabase.from('teams').select('id, fullname, shortname, logotype').eq('user_id', userId);

    return committee.map(c => {
      const team = teams?.find(t => t.id === c.team_id);
      return {
        ...c,
        team_name: team?.fullname,
        team_shortname: team?.shortname,
        team_logotype: team?.logotype
      };
    });
  },
  createCommittee: async (userId: string, member: CommitteeMember) => {
    const { data, error } = await supabase.from('committee').insert([{ ...member, user_id: userId }]).select().single();
    if (error) throw error;
    return data;
  },
  updateCommittee: async (id: string, updates: Partial<CommitteeMember>) => {
    const { data, error } = await supabase.from('committee').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteCommittee: async (id: string) => {
    const { error } = await supabase.from('committee').delete().eq('id', id);
    if (error) throw error;
  },

  // Tournaments
  getTournaments: async (userId: string) => {
    const { data, error } = await supabase.from('tournaments').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
  },
  getTournament: async (id: string) => {
    const { data: tournament, error: tError } = await supabase.from('tournaments').select('*').eq('id', id).single();
    if (tError || !tournament) return null;
    
    const { data: matches } = await supabase.from('matches').select('*').eq('tournament_id', id);
    const { data: teams } = await supabase.from('teams').select('id, fullname, shortname, logotype');

    const enrichedMatches = (matches || [])
      .map(m => {
          const teamA = teams?.find(t => t.id === m.team_a_id);
          const teamB = teams?.find(t => t.id === m.team_b_id);
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

    return { ...tournament, matches: enrichedMatches };
  },
  createTournament: async (userId: string, tournament: Tournament) => {
    const { data, error } = await supabase.from('tournaments').insert([{ ...tournament, user_id: userId }]).select().single();
    if (error) throw error;
    return data;
  },
  updateTournament: async (id: string, updates: Partial<Tournament>) => {
    const { data, error } = await supabase.from('tournaments').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteTournament: async (id: string) => {
    await supabase.from('matches').delete().eq('tournament_id', id);
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) throw error;
  },

  // Matches
  getMatches: async (userId: string) => {
    const { data: matches, error } = await supabase.from('matches').select('*').eq('user_id', userId);
    if (error) throw error;
    
    const { data: tournaments } = await supabase.from('tournaments').select('id, fullname, logotype').eq('user_id', userId);
    const { data: teams } = await supabase.from('teams').select('id, fullname, shortname, logotype').eq('user_id', userId);

    return matches.map(m => {
      const tournament = tournaments?.find(t => t.id === m.tournament_id);
      const teamA = teams?.find(t => t.id === m.team_a_id);
      const teamB = teams?.find(t => t.id === m.team_b_id);
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
    const { data: m, error } = await supabase.from('matches').select('*').eq('id', id).single();
    if (error || !m) return null;
    
    const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', m.tournament_id).single();
    const { data: teamA } = await supabase.from('teams').select('*').eq('id', m.team_a_id).single();
    const { data: teamB } = await supabase.from('teams').select('*').eq('id', m.team_b_id).single();
    
    const { data: athletes } = await supabase.from('athletes').select('*').in('team_id', [m.team_a_id, m.team_b_id]);
    const { data: committee } = await supabase.from('committee').select('*').in('team_id', [m.team_a_id, m.team_b_id]);

    const teamAAthletes = athletes?.filter(a => a.team_id === teamA?.id) || [];
    const teamBAthletes = athletes?.filter(a => a.team_id === teamB?.id) || [];
    const teamACommittee = committee?.filter(c => c.team_id === teamA?.id) || [];
    const teamBCommittee = committee?.filter(c => c.team_id === teamB?.id) || [];

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
  createMatch: async (userId: string, matchData: any) => {
    const { data: matches } = await supabase.from('matches').select('id').eq('user_id', userId);
    
    let maxNum = 0;
    (matches || []).forEach(m => {
        const match = m.id.match(/GAME (\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
        }
    });
    const nextNum = maxNum + 1;
    const id = `GAME ${nextNum}`;
    const newMatch = { ...matchData, id, code: id, user_id: userId };
    
    const { data, error } = await supabase.from('matches').insert([newMatch]).select().single();
    if (error) throw error;
    return data;
  },
  updateMatch: async (id: string, updates: Partial<Match>) => {
    const { data, error } = await supabase.from('matches').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteMatch: async (id: string) => {
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) throw error;
  },

  // Backup/Restore
  getBackup: async () => {
    const { data: teams } = await supabase.from('teams').select('*');
    const { data: athletes } = await supabase.from('athletes').select('*');
    const { data: committee } = await supabase.from('committee').select('*');
    const { data: tournaments } = await supabase.from('tournaments').select('*');
    const { data: matches } = await supabase.from('matches').select('*');
    
    return {
      teams: teams || [],
      athletes: athletes || [],
      committee: committee || [],
      tournaments: tournaments || [],
      matches: matches || []
    };
  },
  restoreBackup: async (backupData: AppData) => {
    const user_id = await getUserId();
    if (!user_id) throw new Error("User not authenticated");
    
    // 1. Insert Teams (Parent)
    if (backupData.teams?.length) {
      const teams = backupData.teams.map(t => ({ 
        ...t, 
        shortname: t.shortname || t.fullname?.substring(0, 3).toUpperCase() || 'UNK',
        user_id 
      }));
      const { error } = await supabase.from('teams').upsert(teams);
      if (error) throw new Error(`Teams import error: ${error.message}`);
    }

    // 2. Insert Tournaments (Parent)
    if (backupData.tournaments?.length) {
      const tournaments = backupData.tournaments.map(t => ({ 
        ...t, 
        shortname: t.shortname || t.fullname?.substring(0, 3).toUpperCase() || 'UNK',
        season: t.season || new Date().getFullYear().toString(),
        main_color: t.main_color || '#f97316',
        user_id 
      }));
      const { error } = await supabase.from('tournaments').upsert(tournaments);
      if (error) throw new Error(`Tournaments import error: ${error.message}`);
    }

    // 3. Insert Athletes (Child of Teams)
    if (backupData.athletes?.length) {
      const athletes = backupData.athletes.map(a => ({ 
        ...a, 
        date_of_birth: a.date_of_birth || '2000-01-01',
        user_id 
      }));
      const { error } = await supabase.from('athletes').upsert(athletes);
      if (error) throw new Error(`Athletes import error: ${error.message}`);
    }

    // 4. Insert Committee (Child of Teams)
    if (backupData.committee?.length) {
      const committee = backupData.committee.map(c => ({ ...c, user_id }));
      const { error } = await supabase.from('committee').upsert(committee);
      if (error) throw new Error(`Committee import error: ${error.message}`);
    }

    // 5. Insert Matches (Child of Tournaments and Teams)
    if (backupData.matches?.length) {
      const matches = backupData.matches.map(m => ({ 
        ...m, 
        code: m.code || m.id,
        phase: m.phase || 'Group Stage',
        round: m.round || '1',
        date: m.date || new Date().toISOString().split('T')[0],
        user_id 
      }));
      const { error } = await supabase.from('matches').upsert(matches);
      if (error) throw new Error(`Matches import error: ${error.message}`);
    }
  },
  migrateData: async () => {
    // Migration from localforage is no longer handled here automatically
    // It can be done via the import button if the user exports first
    return false;
  }
};
