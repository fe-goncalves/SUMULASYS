import { supabase } from './supabase';
import { persistLogotype, expectedLogoUrl, isRemoteUrl, isDataUrl, LOGOS_BUCKET } from './utils/logoStorage';
import { clearCache } from './utils/cache';

function generateMatchId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `GAME-${timestamp}-${random}`;
}

function sanitizeSearch(raw: string): string {
  return raw.replace(/[%_,()]/g, ' ').trim();
}

function sortByName<T extends { fullname?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.fullname || '').localeCompare(b.fullname || ''));
}

function nestedOne(value: any) {
  return Array.isArray(value) ? value[0] : value;
}

function stripFileFields(data: any) {
  const next = { ...data };
  delete next.logotypeFile;
  delete next._file;
  if (next.logotype && typeof next.logotype !== 'string') {
    delete next.logotype;
  }
  if (typeof next.logotype === 'string' && next.logotype.startsWith('blob:')) {
    delete next.logotype;
  }
  return next;
}

// Teams
export async function fetchTeams(userId: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('id, fullname, shortname, main_color, user_id')
    .eq('user_id', userId);
  if (error) throw error;

  return sortByName(
    (data || []).map((team) => ({
      ...team,
      logotype: expectedLogoUrl(userId, 'teams', team.id),
    })),
  );
}

export async function fetchTeam(id: string) {
  const [{ data: team, error: teamError }, { data: athletes }, { data: committee }] = await Promise.all([
    supabase.from('teams').select('id, fullname, shortname, logotype, main_color, user_id').eq('id', id).single(),
    supabase.from('athletes').select('id, fullname, surname, date_of_birth, team_id').eq('team_id', id),
    supabase.from('committee').select('id, fullname, surname, team_id').eq('team_id', id),
  ]);
  if (teamError) throw teamError;

  if (team && isDataUrl(team.logotype) && team.user_id) {
    try {
      const url = await persistLogotype(team.user_id, 'teams', team.id, team.logotype);
      if (url && isRemoteUrl(url)) {
        await supabase.from('teams').update({ logotype: url }).eq('id', team.id);
        team.logotype = url;
      }
    } catch (err) {
      console.warn('Could not migrate team logo', err);
    }
  }

  return { ...team, athletes: athletes || [], committee: committee || [] };
}

export async function createTeam(userId: string, data: any) {
  const payload = stripFileFields(data);
  const source = data.logotypeFile || data._file || payload.logotype;
  payload.logotype = await persistLogotype(userId, 'teams', payload.id, source);

  const { data: newTeam, error } = await supabase
    .from('teams')
    .insert({ ...payload, user_id: userId })
    .select('id, fullname, shortname, logotype, main_color, user_id')
    .single();
  if (error) throw error;
  return newTeam;
}

export async function updateTeam(id: string, data: any, userId?: string) {
  const payload = stripFileFields(data);
  const source = data.logotypeFile || data._file || payload.logotype;
  if (source && (source instanceof File || (typeof source === 'string' && !isRemoteUrl(source) && source.startsWith('data:')))) {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (uid) {
      payload.logotype = await persistLogotype(uid, 'teams', id, source);
    }
  }

  const { data: updatedTeam, error } = await supabase
    .from('teams')
    .update(payload)
    .eq('id', id)
    .select('id, fullname, shortname, logotype, main_color, user_id')
    .single();
  if (error) throw error;
  return updatedTeam;
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}

// Athletes
export async function fetchAthletes(
  userId: string,
  limit: number = 80,
  offset: number = 0,
  search: string = '',
) {
  const term = sanitizeSearch(search);
  let query = supabase
    .from('athletes')
    .select(`
      id, fullname, surname, date_of_birth, team_id,
      teams(id, fullname, shortname, main_color)
    `)
    .eq('user_id', userId)
    .order('surname', { ascending: true })
    .range(offset, offset + limit - 1);

  if (term) {
    const { data: matchedTeams } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userId)
      .or(`fullname.ilike.%${term}%,shortname.ilike.%${term}%`);
    const teamIds = (matchedTeams || []).map((t) => t.id);
    const teamFilter = teamIds.length ? `,team_id.in.(${teamIds.join(',')})` : '';
    query = query.or(`fullname.ilike.%${term}%,surname.ilike.%${term}%,id.ilike.%${term}%${teamFilter}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const processed = (data || []).map((a) => {
    const teamData = nestedOne(a.teams);
    const teamId = teamData?.id || a.team_id;
    return {
      ...a,
      team_name: teamData?.fullname,
      team_shortname: teamData?.shortname,
      team_main_color: teamData?.main_color,
      team_logotype: teamId ? expectedLogoUrl(userId, 'teams', teamId) : null,
    };
  });

  processed.sort((a, b) => (a.fullname || '').localeCompare(b.fullname || ''));
  return processed;
}

export async function createAthlete(userId: string, data: any) {
  const { data: newAthlete, error } = await supabase.from('athletes').insert({ ...data, user_id: userId }).select().single();
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
export async function fetchCommittee(
  userId: string,
  limit: number = 80,
  offset: number = 0,
  search: string = '',
) {
  const term = sanitizeSearch(search);
  let query = supabase
    .from('committee')
    .select(`
      id, fullname, surname, team_id,
      teams(id, fullname, shortname, main_color)
    `)
    .eq('user_id', userId)
    .order('surname', { ascending: true })
    .range(offset, offset + limit - 1);

  if (term) {
    const { data: matchedTeams } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userId)
      .or(`fullname.ilike.%${term}%,shortname.ilike.%${term}%`);
    const teamIds = (matchedTeams || []).map((t) => t.id);
    const teamFilter = teamIds.length ? `,team_id.in.(${teamIds.join(',')})` : '';
    query = query.or(`fullname.ilike.%${term}%,surname.ilike.%${term}%,id.ilike.%${term}%${teamFilter}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const processed = (data || []).map((c) => {
    const teamData = nestedOne(c.teams);
    const teamId = teamData?.id || c.team_id;
    return {
      ...c,
      team_name: teamData?.fullname,
      team_shortname: teamData?.shortname,
      team_main_color: teamData?.main_color,
      team_logotype: teamId ? expectedLogoUrl(userId, 'teams', teamId) : null,
    };
  });

  processed.sort((a, b) => (a.fullname || '').localeCompare(b.fullname || ''));
  return processed;
}

export async function createCommittee(userId: string, data: any) {
  const { data: newMember, error } = await supabase.from('committee').insert({ ...data, user_id: userId }).select().single();
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
export async function fetchTournaments(userId: string) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('id, fullname, shortname, season, main_color, user_id')
    .eq('user_id', userId);
  if (error) throw error;

  return sortByName(
    (data || []).map((tournament) => ({
      ...tournament,
      logotype: expectedLogoUrl(userId, 'tournaments', tournament.id),
    })),
  );
}

export async function fetchTournament(id: string) {
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('id, fullname, shortname, season, logotype, main_color, user_id')
    .eq('id', id)
    .single();
  if (tournamentError) throw tournamentError;

  if (tournament && isDataUrl(tournament.logotype) && tournament.user_id) {
    try {
      const url = await persistLogotype(tournament.user_id, 'tournaments', tournament.id, tournament.logotype);
      if (url && isRemoteUrl(url)) {
        await supabase.from('tournaments').update({ logotype: url }).eq('id', tournament.id);
        tournament.logotype = url;
      }
    } catch (err) {
      console.warn('Could not migrate tournament logo', err);
    }
  }

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, code, date, phase, round, tournament_id, team_a_id, team_b_id,
      team_a:teams!matches_team_a_id_fkey(id, fullname, shortname, main_color),
      team_b:teams!matches_team_b_id_fkey(id, fullname, shortname, main_color)
    `)
    .eq('tournament_id', id)
    .order('date', { ascending: true });

  const formattedMatches = (matches || []).map((m) => {
    const teamA = nestedOne(m.team_a);
    const teamB = nestedOne(m.team_b);
    return {
      ...m,
      team_a_name: teamA?.fullname,
      team_a_shortname: teamA?.shortname,
      team_a_logotype: teamA?.id ? expectedLogoUrl(tournament.user_id, 'teams', teamA.id) : null,
      team_b_name: teamB?.fullname,
      team_b_shortname: teamB?.shortname,
      team_b_logotype: teamB?.id ? expectedLogoUrl(tournament.user_id, 'teams', teamB.id) : null,
    };
  });

  return { ...tournament, matches: formattedMatches };
}

export async function createTournament(userId: string, data: any) {
  const payload = stripFileFields(data);
  const source = data.logotypeFile || data._file || payload.logotype;
  payload.logotype = await persistLogotype(userId, 'tournaments', payload.id, source);

  const { data: newTournament, error } = await supabase
    .from('tournaments')
    .insert({ ...payload, user_id: userId })
    .select('id, fullname, shortname, season, logotype, main_color, user_id')
    .single();
  if (error) throw error;
  return newTournament;
}

export async function updateTournament(id: string, data: any, userId?: string) {
  const payload = stripFileFields(data);
  const source = data.logotypeFile || data._file || payload.logotype;
  if (source && (source instanceof File || (typeof source === 'string' && source.startsWith('data:')))) {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (uid) {
      payload.logotype = await persistLogotype(uid, 'tournaments', id, source);
    }
  }

  const { data: updatedTournament, error } = await supabase
    .from('tournaments')
    .update(payload)
    .eq('id', id)
    .select('id, fullname, shortname, season, logotype, main_color, user_id')
    .single();
  if (error) throw error;
  return updatedTournament;
}

export async function deleteTournament(id: string) {
  const { error } = await supabase.from('tournaments').delete().eq('id', id);
  if (error) throw error;
}

// Matches
export async function fetchMatches(userId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
        id, code, date, phase, round, tournament_id, team_a_id, team_b_id, user_id,
        tournament:tournaments(id, fullname, main_color),
        team_a:teams!matches_team_a_id_fkey(id, fullname, shortname, main_color),
        team_b:teams!matches_team_b_id_fkey(id, fullname, shortname, main_color)
      `)
    .eq('user_id', userId);
  if (error) throw error;

  return (data || []).map((m) => {
    const tournamentData = nestedOne(m.tournament);
    const teamAData = nestedOne(m.team_a);
    const teamBData = nestedOne(m.team_b);

    return {
      ...m,
      tournament_name: tournamentData?.fullname,
      tournament_logotype: tournamentData?.id ? expectedLogoUrl(userId, 'tournaments', tournamentData.id) : null,
      team_a_name: teamAData?.fullname,
      team_a_shortname: teamAData?.shortname,
      team_a_logotype: teamAData?.id ? expectedLogoUrl(userId, 'teams', teamAData.id) : null,
      team_b_name: teamBData?.fullname,
      team_b_shortname: teamBData?.shortname,
      team_b_logotype: teamBData?.id ? expectedLogoUrl(userId, 'teams', teamBData.id) : null,
    };
  });
}

export async function fetchMatch(id: string) {
  const { data: m, error } = await supabase
    .from('matches')
    .select(`
      id, code, date, phase, round, tournament_id, team_a_id, team_b_id, user_id,
      tournament:tournaments(fullname, logotype, main_color),
      team_a:teams!matches_team_a_id_fkey(id, fullname, shortname, logotype, main_color)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  const tournament = nestedOne(m.tournament);
  const teamA = nestedOne(m.team_a);

  const [{ data: teamB }, teamAAthletes, teamBAthletes, teamACommittee, teamBCommittee] = await Promise.all([
    supabase.from('teams').select('id, fullname, shortname, logotype, main_color').eq('id', m.team_b_id).single(),
    supabase.from('athletes').select('id, fullname, surname, date_of_birth').eq('team_id', m.team_a_id).then((r) => r.data || []),
    supabase.from('athletes').select('id, fullname, surname, date_of_birth').eq('team_id', m.team_b_id).then((r) => r.data || []),
    supabase.from('committee').select('id, fullname, surname').eq('team_id', m.team_a_id).then((r) => r.data || []),
    supabase.from('committee').select('id, fullname, surname').eq('team_id', m.team_b_id).then((r) => r.data || []),
  ]);

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
    team_a: { ...teamA, athletes: teamAAthletes || [], committee: teamACommittee || [] },
    team_b: { ...teamB, athletes: teamBAthletes || [], committee: teamBCommittee || [] },
  };
}

export async function createMatch(userId: string, data: any) {
  try {
    if (!data.tournament_id || !data.date || !data.phase || !data.round || !data.team_a_id || !data.team_b_id) {
      throw new Error('Missing required fields: tournament_id, date, phase, round, team_a_id, team_b_id');
    }

    if (data.team_a_id === data.team_b_id) {
      throw new Error('Team A and Team B cannot be the same team');
    }

    const id = generateMatchId();
    const newMatch = { ...data, id, code: id, user_id: userId };

    const { data: insertedMatch, error } = await supabase.from('matches').insert(newMatch).select().single();
    if (error) {
      console.error('Error inserting match:', error);
      throw new Error(`Failed to create match: ${error.message}`);
    }

    return insertedMatch;
  } catch (error: any) {
    console.error('createMatch error:', error);
    throw error;
  }
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

async function upsertInChunks(table: string, rows: any[], chunkSize = 200) {
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk);
    if (error) throw error;
  }
}

async function persistLogosSequentially(
  userId: string,
  folder: 'teams' | 'tournaments',
  rows: any[],
) {
  const result = [];
  for (const row of rows) {
    let logotype = row.logotype || null;
    if (isDataUrl(logotype)) {
      logotype = await persistLogotype(userId, folder, row.id, logotype);
    } else if (typeof logotype === 'string' && !isRemoteUrl(logotype)) {
      logotype = null;
    }
    result.push({ ...row, logotype });
  }
  return result;
}

async function removeUserLogos(userId: string) {
  for (const folder of ['teams', 'tournaments'] as const) {
    const prefix = `${userId}/${folder}`;
    const { data } = await supabase.storage.from(LOGOS_BUCKET).list(prefix, { limit: 1000 });
    if (!data?.length) continue;
    await supabase.storage.from(LOGOS_BUCKET).remove(data.map((file) => `${prefix}/${file.name}`));
  }
}

export async function deleteAllUserData(userId: string): Promise<void> {
  for (const table of ['matches', 'athletes', 'committee', 'teams', 'tournaments'] as const) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) throw error;
  }
  await removeUserLogos(userId);
  clearCache(undefined, userId);
}

// Backup
export async function exportData(userId: string) {
  const [
    { data: teams },
    { data: athletes },
    { data: committee },
    { data: tournaments },
    { data: matches },
  ] = await Promise.all([
    supabase.from('teams').select('id, fullname, shortname, logotype, main_color, user_id').eq('user_id', userId),
    supabase.from('athletes').select('id, fullname, surname, date_of_birth, team_id, user_id').eq('user_id', userId),
    supabase.from('committee').select('id, fullname, surname, team_id, user_id').eq('user_id', userId),
    supabase.from('tournaments').select('id, fullname, shortname, season, logotype, main_color, user_id').eq('user_id', userId),
    supabase.from('matches').select('id, code, tournament_id, team_a_id, team_b_id, phase, round, date, user_id').eq('user_id', userId),
  ]);

  return {
    teams: teams || [],
    athletes: athletes || [],
    committee: committee || [],
    tournaments: tournaments || [],
    matches: matches || [],
  };
}

export async function importData(
  userId: string,
  data: any,
  options: { replace?: boolean } = { replace: true },
): Promise<{ success: boolean; error?: string; counts?: Record<string, number> }> {
  try {
    if (options.replace) {
      await deleteAllUserData(userId);
    }

    const teams = await persistLogosSequentially(userId, 'teams', (data.teams || []).map((t: any) => ({
      id: t.id,
      fullname: t.fullname,
      shortname: t.shortname,
      logotype: t.logotype || null,
      main_color: t.main_color || '#f97316',
      user_id: userId,
    })));

    const athletes = (data.athletes || []).map((a: any) => ({
      id: a.id,
      fullname: a.fullname,
      surname: a.surname,
      date_of_birth: a.date_of_birth,
      team_id: a.team_id === '' ? null : a.team_id,
      user_id: userId,
    }));

    const committee = (data.committee || []).map((c: any) => ({
      id: c.id,
      fullname: c.fullname,
      surname: c.surname,
      team_id: c.team_id === '' ? null : c.team_id,
      user_id: userId,
    }));

    const tournaments = await persistLogosSequentially(userId, 'tournaments', (data.tournaments || []).map((t: any) => ({
      id: t.id,
      fullname: t.fullname,
      shortname: t.shortname,
      season: t.season,
      logotype: t.logotype || null,
      main_color: t.main_color || '#f97316',
      user_id: userId,
    })));

    const matches = (data.matches || []).map((m: any) => ({
      id: m.id,
      code: m.code || m.id,
      tournament_id: m.tournament_id === '' ? null : m.tournament_id,
      team_a_id: m.team_a_id === '' ? null : m.team_a_id,
      team_b_id: m.team_b_id === '' ? null : m.team_b_id,
      phase: m.phase,
      round: m.round,
      date: m.date,
      user_id: userId,
    }));

    if (teams.length > 0) await upsertInChunks('teams', teams);
    if (athletes.length > 0) await upsertInChunks('athletes', athletes);
    if (committee.length > 0) await upsertInChunks('committee', committee);
    if (tournaments.length > 0) await upsertInChunks('tournaments', tournaments);
    if (matches.length > 0) await upsertInChunks('matches', matches);

    clearCache(undefined, userId);

    return {
      success: true,
      counts: {
        teams: teams.length,
        athletes: athletes.length,
        committee: committee.length,
        tournaments: tournaments.length,
        matches: matches.length,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
