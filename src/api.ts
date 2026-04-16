import { supabase } from './supabase';
import { getCachedData, setCachedData, clearCache } from './utils/cache';

export const API_URL = ''; // Not used anymore

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
};

const getCacheKey = (base: string, userId: string) => `${base}_${userId}`;
const getPagingCacheKey = (base: string, userId: string, limit: number, offset: number) => `${base}_${userId}_${limit}_${offset}`;

// Teams
export async function fetchTeams() {
  const userId = await getUserId();
  const cacheKey = getCacheKey('teams', userId);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.from('teams').select('*').eq('user_id', userId);
  if (error) throw error;

  setCachedData(cacheKey, data);
  return data;
}

export async function fetchTeam(id: string) {
  const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('id', id).single();
  if (teamError) throw teamError;

  const { data: athletes } = await supabase.from('athletes').select('*').eq('team_id', id);
  const { data: committee } = await supabase.from('committee').select('*').eq('team_id', id);

  return { ...team, athletes: athletes || [], committee: committee || [] };
}

export async function createTeam(data: any) {
  const user_id = await getUserId();
  const { data: newTeam, error } = await supabase.from('teams').insert({ ...data, user_id }).select().single();
  if (error) throw error;
  clearCache('teams');
  return newTeam;
}

export async function updateTeam(id: string, data: any) {
  const { data: updatedTeam, error } = await supabase.from('teams').update(data).eq('id', id).select().single();
  if (error) throw error;
  clearCache('teams');
  return updatedTeam;
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
  clearCache('teams');
}

// Athletes
export async function fetchAthletes(limit: number = 500, offset: number = 0) {
  const userId = await getUserId();
  const cacheKey = getPagingCacheKey('athletes', userId, limit, offset);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('athletes')
    .select(`
      *,
      teams(fullname, shortname, logotype)
    `)
    .eq('user_id', userId)
    .order('surname', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const processedData = data.map(a => {
    const teamData = Array.isArray(a.teams) ? a.teams[0] : a.teams;
    return {
      ...a,
      team_name: teamData?.fullname,
      team_shortname: teamData?.shortname,
      team_logotype: teamData?.logotype
    };
  });

  // Sort by fullname as secondary sort in JavaScript
  processedData.sort((a, b) => a.fullname.localeCompare(b.fullname));
  setCachedData(cacheKey, processedData);
  return processedData;
}

export async function fetchAthletesCount() {
  const userId = await getUserId();
  const { count, error } = await supabase
    .from('athletes')
    .select('id', { count: 'estimated', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count || 0;
}

export async function createAthlete(data: any) {
  const user_id = await getUserId();
  const { data: newAthlete, error } = await supabase.from('athletes').insert({ ...data, user_id }).select().single();
  if (error) throw error;
  clearCache('athletes');
  return newAthlete;
}

export async function updateAthlete(id: string, data: any) {
  const { data: updatedAthlete, error } = await supabase.from('athletes').update(data).eq('id', id).select().single();
  if (error) throw error;
  clearCache('athletes');
  return updatedAthlete;
}

export async function deleteAthlete(id: string) {
  const { error } = await supabase.from('athletes').delete().eq('id', id);
  if (error) throw error;
  clearCache('athletes');
}

// Committee
export async function fetchCommittee(limit: number = 500, offset: number = 0) {
  const userId = await getUserId();
  const cacheKey = getPagingCacheKey('committee', userId, limit, offset);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('committee')
    .select(`
      *,
      teams(fullname, shortname, logotype)
    `)
    .eq('user_id', userId)
    .order('surname', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const processedData = data.map(c => {
    const teamData = Array.isArray(c.teams) ? c.teams[0] : c.teams;
    return {
      ...c,
      team_name: teamData?.fullname,
      team_shortname: teamData?.shortname,
      team_logotype: teamData?.logotype
    };
  });

  // Sort by fullname as secondary sort in JavaScript
  processedData.sort((a, b) => a.fullname.localeCompare(b.fullname));
  setCachedData(cacheKey, processedData);
  return processedData;
}

export async function fetchCommitteeCount(): Promise<number> {
  const userId = await getUserId();
  const { count, error } = await supabase
    .from('committee')
    .select('id', { count: 'estimated', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count || 0;
}

export async function createCommittee(data: any) {
  const user_id = await getUserId();
  const { data: newMember, error } = await supabase.from('committee').insert({ ...data, user_id }).select().single();
  if (error) throw error;
  clearCache('committee');
  return newMember;
}

export async function updateCommittee(id: string, data: any) {
  const { data: updatedMember, error } = await supabase.from('committee').update(data).eq('id', id).select().single();
  if (error) throw error;
  clearCache('committee');
  return updatedMember;
}

export async function deleteCommittee(id: string) {
  const { error } = await supabase.from('committee').delete().eq('id', id);
  if (error) throw error;
  clearCache('committee');
}

// Tournaments
export async function fetchTournaments() {
  const userId = await getUserId();
  const cacheKey = getCacheKey('tournaments', userId);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.from('tournaments').select('*').eq('user_id', userId);
  if (error) throw error;

  setCachedData(cacheKey, data);
  return data;
}

export async function fetchTournament(id: string) {
  const { data: tournament, error: tournamentError } = await supabase.from('tournaments').select('*').eq('id', id).single();
  if (tournamentError) throw tournamentError;

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(fullname, shortname, logotype),
      team_b:teams!matches_team_b_id_fkey(fullname, shortname, logotype)
    `)
    .eq('tournament_id', id)
    .order('date', { ascending: true });

  const formattedMatches = (matches || []).map(m => ({
    ...m,
    team_a_name: m.team_a?.fullname,
    team_a_shortname: m.team_a?.shortname,
    team_a_logotype: m.team_a?.logotype,
    team_b_name: m.team_b?.fullname,
    team_b_shortname: m.team_b?.shortname,
    team_b_logotype: m.team_b?.logotype,
  }));

  return { ...tournament, matches: formattedMatches };
}

export async function createTournament(data: any) {
  const user_id = await getUserId();
  const { data: newTournament, error } = await supabase.from('tournaments').insert({ ...data, user_id }).select().single();
  if (error) throw error;
  clearCache('tournaments');
  return newTournament;
}

export async function updateTournament(id: string, data: any) {
  const { data: updatedTournament, error } = await supabase.from('tournaments').update(data).eq('id', id).select().single();
  if (error) throw error;
  clearCache('tournaments');
  return updatedTournament;
}

export async function deleteTournament(id: string) {
  const { error } = await supabase.from('tournaments').delete().eq('id', id);
  if (error) throw error;
  clearCache('tournaments');
}

// Matches
export async function fetchMatches() {
  const userId = await getUserId();
  const cacheKey = getCacheKey('matches', userId);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      tournament:tournaments(fullname, logotype),
      team_a:teams!matches_team_a_id_fkey(fullname, shortname, logotype),
      team_b:teams!matches_team_b_id_fkey(fullname, shortname, logotype)
    `)
    .eq('user_id', userId);
  if (error) throw error;

  const formattedData = data.map(m => {
    const tournamentData = Array.isArray(m.tournament) ? m.tournament[0] : m.tournament;
    const teamAData = Array.isArray(m.team_a) ? m.team_a[0] : m.team_a;
    const teamBData = Array.isArray(m.team_b) ? m.team_b[0] : m.team_b;
    
    return {
      ...m,
      tournament_name: tournamentData?.fullname,
      tournament_logotype: tournamentData?.logotype,
      team_a_name: teamAData?.fullname,
      team_a_shortname: teamAData?.shortname,
      team_a_logotype: teamAData?.logotype,
      team_b_name: teamBData?.fullname,
      team_b_shortname: teamBData?.shortname,
      team_b_logotype: teamBData?.logotype,
    };
  });

  setCachedData(cacheKey, formattedData);
  return formattedData;
}

export async function fetchMatch(id: string) {
  const { data: m, error } = await supabase
    .from('matches')
    .select(`
      *,
      tournament:tournaments(fullname, logotype, main_color),
      team_a:teams!matches_team_a_id_fkey(*)
    `)
    .eq('id', id)
    .single();
    
  if (error) throw error;

  // Get only the team_b data
  const { data: teamB } = await supabase
    .from('teams')
    .select('*')
    .eq('id', m.team_b_id)
    .single();

  // Load athletes and committee in parallel for both teams
  const [teamAAthletes, teamBAthletes, teamACommittee, teamBCommittee] = await Promise.all([
    supabase.from('athletes').select('id,fullname,surname,date_of_birth').eq('team_id', m.team_a_id).then(r => r.data || []),
    supabase.from('athletes').select('id,fullname,surname,date_of_birth').eq('team_id', m.team_b_id).then(r => r.data || []),
    supabase.from('committee').select('id,fullname,surname,role').eq('team_id', m.team_a_id).then(r => r.data || []),
    supabase.from('committee').select('id,fullname,surname,role').eq('team_id', m.team_b_id).then(r => r.data || [])
  ]);

  return {
    ...m,
    tournament_name: m.tournament?.fullname,
    tournament_logotype: m.tournament?.logotype,
    tournament_main_color: m.tournament?.main_color,
    team_a_name: m.team_a?.fullname,
    team_a_shortname: m.team_a?.shortname,
    team_a_logotype: m.team_a?.logotype,
    team_b_name: teamB?.fullname,
    team_b_shortname: teamB?.shortname,
    team_b_logotype: teamB?.logotype,
    team_a: { ...m.team_a, athletes: teamAAthletes || [], committee: teamACommittee || [] },
    team_b: { ...teamB, athletes: teamBAthletes || [], committee: teamBCommittee || [] }
  };
}

export async function createMatch(data: any) {
  const user_id = await getUserId();
  
  // Find max game number by sorting DESC and taking first record
  const { data: lastMatch } = await supabase
    .from('matches')
    .select('id')
    .eq('user_id', user_id)
    .order('id', { ascending: false })
    .limit(1);
  
  let maxNum = 0;
  if (lastMatch && lastMatch.length > 0) {
    const match = lastMatch[0].id.match(/GAME (\d+)/);
    if (match) {
      maxNum = parseInt(match[1]);
    }
  }
  
  const nextNum = maxNum + 1;
  const id = `GAME ${nextNum}`;
  const newMatch = { ...data, id, code: id, user_id };
  
  const { data: insertedMatch, error } = await supabase.from('matches').insert(newMatch).select().single();
  if (error) throw error;
  
  clearCache('matches');
  return insertedMatch;
}

export async function updateMatch(id: string, data: any) {
  const { data: updatedMatch, error } = await supabase.from('matches').update(data).eq('id', id).select().single();
  if (error) throw error;
  clearCache('matches');
  return updatedMatch;
}

export async function deleteMatch(id: string) {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) throw error;
  clearCache('matches');
}

// Backup
export async function exportData() {
  const userId = await getUserId();
  
  const [
    { data: teams },
    { data: athletes },
    { data: committee },
    { data: tournaments },
    { data: matches }
  ] = await Promise.all([
    supabase.from('teams').select('*').eq('user_id', userId),
    supabase.from('athletes').select('*').eq('user_id', userId),
    supabase.from('committee').select('*').eq('user_id', userId),
    supabase.from('tournaments').select('*').eq('user_id', userId),
    supabase.from('matches').select('*').eq('user_id', userId)
  ]);

  return {
    teams: teams || [],
    athletes: athletes || [],
    committee: committee || [],
    tournaments: tournaments || [],
    matches: matches || []
  };
}

export async function importData(data: any): Promise<{ success: boolean; error?: string }> {
  try {
    const user_id = await getUserId();
    
    // Add user_id to all records and sanitize foreign keys and strip extra fields
    const teams = (data.teams || []).map((t: any) => ({ 
      id: t.id,
      fullname: t.fullname,
      shortname: t.shortname,
      logotype: t.logotype || null,
      main_color: t.main_color || '#f97316',
      user_id
    }));
    
    const athletes = (data.athletes || []).map((a: any) => ({ 
      id: a.id,
      fullname: a.fullname,
      surname: a.surname,
      date_of_birth: a.date_of_birth,
      team_id: a.team_id === "" ? null : a.team_id,
      user_id
    }));
    
    const committee = (data.committee || []).map((c: any) => ({ 
      id: c.id,
      fullname: c.fullname,
      surname: c.surname,
      team_id: c.team_id === "" ? null : c.team_id,
      user_id
    }));
    
    const tournaments = (data.tournaments || []).map((t: any) => ({ 
      id: t.id,
      fullname: t.fullname,
      shortname: t.shortname,
      season: t.season,
      logotype: t.logotype || null,
      main_color: t.main_color || '#f97316',
      user_id
    }));
    
    const matches = (data.matches || []).map((m: any) => ({ 
      id: m.id,
      code: m.code || m.id,
      tournament_id: m.tournament_id === "" ? null : m.tournament_id,
      team_a_id: m.team_a_id === "" ? null : m.team_a_id,
      team_b_id: m.team_b_id === "" ? null : m.team_b_id,
      phase: m.phase,
      round: m.round,
      date: m.date,
      user_id
    }));

    // Insert in order to respect foreign keys
    if (teams.length > 0) {
      const { error } = await supabase.from('teams').upsert(teams);
      if (error) throw error;
    }
    
    if (athletes.length > 0) {
      const { error } = await supabase.from('athletes').upsert(athletes);
      if (error) throw error;
    }
    
    if (committee.length > 0) {
      const { error } = await supabase.from('committee').upsert(committee);
      if (error) throw error;
    }
    
    if (tournaments.length > 0) {
      const { error } = await supabase.from('tournaments').upsert(tournaments);
      if (error) throw error;
    }
    
    if (matches.length > 0) {
      const { error } = await supabase.from('matches').upsert(matches);
      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
