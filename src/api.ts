import { supabase } from './supabase';

export const API_URL = ''; // Not used anymore

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
};

// Teams
export async function fetchTeams() {
  const { data, error } = await supabase.from('teams').select('*');
  if (error) throw error;
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
  return newTeam;
}

export async function updateTeam(id: string, data: any) {
  const { data: updatedTeam, error } = await supabase.from('teams').update(data).eq('id', id).select().single();
  if (error) throw error;
  return updatedTeam;
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}

// Athletes
export async function fetchAthletes() {
  const { data, error } = await supabase
    .from('athletes')
    .select(`
      *,
      team:teams(fullname, shortname, logotype)
    `);
  if (error) throw error;
  
  return data.map(a => ({
    ...a,
    team_name: a.team?.fullname,
    team_shortname: a.team?.shortname,
    team_logotype: a.team?.logotype
  }));
}

export async function createAthlete(data: any) {
  const user_id = await getUserId();
  const { data: newAthlete, error } = await supabase.from('athletes').insert({ ...data, user_id }).select().single();
  if (error) throw error;
  return newAthlete;
}

export async function updateAthlete(id: string, data: any) {
  const { data: updatedAthlete, error } = await supabase.from('athletes').update(data).eq('id', id).select().single();
  if (error) throw error;
  return updatedAthlete;
}

export async function deleteAthlete(id: string) {
  const { error } = await supabase.from('athletes').delete().eq('id', id);
  if (error) throw error;
}

// Committee
export async function fetchCommittee() {
  const { data, error } = await supabase
    .from('committee')
    .select(`
      *,
      team:teams(fullname, shortname, logotype)
    `);
  if (error) throw error;
  
  return data.map(c => ({
    ...c,
    team_name: c.team?.fullname,
    team_shortname: c.team?.shortname,
    team_logotype: c.team?.logotype
  }));
}

export async function createCommittee(data: any) {
  const user_id = await getUserId();
  const { data: newMember, error } = await supabase.from('committee').insert({ ...data, user_id }).select().single();
  if (error) throw error;
  return newMember;
}

export async function updateCommittee(id: string, data: any) {
  const { data: updatedMember, error } = await supabase.from('committee').update(data).eq('id', id).select().single();
  if (error) throw error;
  return updatedMember;
}

export async function deleteCommittee(id: string) {
  const { error } = await supabase.from('committee').delete().eq('id', id);
  if (error) throw error;
}

// Tournaments
export async function fetchTournaments() {
  const { data, error } = await supabase.from('tournaments').select('*');
  if (error) throw error;
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
  return newTournament;
}

export async function updateTournament(id: string, data: any) {
  const { data: updatedTournament, error } = await supabase.from('tournaments').update(data).eq('id', id).select().single();
  if (error) throw error;
  return updatedTournament;
}

export async function deleteTournament(id: string) {
  const { error } = await supabase.from('tournaments').delete().eq('id', id);
  if (error) throw error;
}

// Matches
export async function fetchMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      tournament:tournaments(fullname, logotype),
      team_a:teams!matches_team_a_id_fkey(fullname, shortname, logotype),
      team_b:teams!matches_team_b_id_fkey(fullname, shortname, logotype)
    `);
  if (error) throw error;

  return data.map(m => ({
    ...m,
    tournament_name: m.tournament?.fullname,
    tournament_logotype: m.tournament?.logotype,
    team_a_name: m.team_a?.fullname,
    team_a_shortname: m.team_a?.shortname,
    team_a_logotype: m.team_a?.logotype,
    team_b_name: m.team_b?.fullname,
    team_b_shortname: m.team_b?.shortname,
    team_b_logotype: m.team_b?.logotype,
  }));
}

export async function fetchMatch(id: string) {
  const { data: m, error } = await supabase
    .from('matches')
    .select(`
      *,
      tournament:tournaments(fullname, logotype, main_color),
      team_a:teams!matches_team_a_id_fkey(*),
      team_b:teams!matches_team_b_id_fkey(*)
    `)
    .eq('id', id)
    .single();
    
  if (error) throw error;

  const { data: teamAAthletes } = await supabase.from('athletes').select('*').eq('team_id', m.team_a_id);
  const { data: teamBAthletes } = await supabase.from('athletes').select('*').eq('team_id', m.team_b_id);
  const { data: teamACommittee } = await supabase.from('committee').select('*').eq('team_id', m.team_a_id);
  const { data: teamBCommittee } = await supabase.from('committee').select('*').eq('team_id', m.team_b_id);

  return {
    ...m,
    tournament_name: m.tournament?.fullname,
    tournament_logotype: m.tournament?.logotype,
    tournament_main_color: m.tournament?.main_color,
    team_a_name: m.team_a?.fullname,
    team_a_shortname: m.team_a?.shortname,
    team_a_logotype: m.team_a?.logotype,
    team_b_name: m.team_b?.fullname,
    team_b_shortname: m.team_b?.shortname,
    team_b_logotype: m.team_b?.logotype,
    team_a: { ...m.team_a, athletes: teamAAthletes || [], committee: teamACommittee || [] },
    team_b: { ...m.team_b, athletes: teamBAthletes || [], committee: teamBCommittee || [] }
  };
}

export async function createMatch(data: any) {
  const user_id = await getUserId();
  
  // Find max game number
  const { data: matches } = await supabase.from('matches').select('id');
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
  const newMatch = { ...data, id, code: id, user_id };
  
  const { data: insertedMatch, error } = await supabase.from('matches').insert(newMatch).select().single();
  if (error) throw error;
  return insertedMatch;
}

export async function updateMatch(id: string, data: any) {
  const { data: updatedMatch, error } = await supabase.from('matches').update(data).eq('id', id).select().single();
  if (error) throw error;
  return updatedMatch;
}

export async function deleteMatch(id: string) {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) throw error;
}

// Backup
export async function exportData() {
  const [
    { data: teams },
    { data: athletes },
    { data: committee },
    { data: tournaments },
    { data: matches }
  ] = await Promise.all([
    supabase.from('teams').select('*'),
    supabase.from('athletes').select('*'),
    supabase.from('committee').select('*'),
    supabase.from('tournaments').select('*'),
    supabase.from('matches').select('*')
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
    
    // Add user_id to all records
    const teams = (data.teams || []).map((t: any) => ({ ...t, user_id }));
    const athletes = (data.athletes || []).map((a: any) => ({ ...a, user_id }));
    const committee = (data.committee || []).map((c: any) => ({ ...c, user_id }));
    const tournaments = (data.tournaments || []).map((t: any) => ({ ...t, user_id }));
    const matches = (data.matches || []).map((m: any) => ({ ...m, user_id }));

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
