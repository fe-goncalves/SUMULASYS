import { storage } from './storage';

export const API_URL = ''; // Not used anymore

// Teams
export async function fetchTeams() {
  return storage.getTeams();
}

export async function fetchTeam(id: string) {
  return storage.getTeam(id);
}

export async function createTeam(data: any) {
  return storage.createTeam(data);
}

export async function updateTeam(id: string, data: any) {
  return storage.updateTeam(id, data);
}

export async function deleteTeam(id: string) {
  return storage.deleteTeam(id);
}

// Athletes
export async function fetchAthletes() {
  return storage.getAthletes();
}

export async function createAthlete(data: any) {
  return storage.createAthlete(data);
}

export async function updateAthlete(id: string, data: any) {
  return storage.updateAthlete(id, data);
}

export async function deleteAthlete(id: string) {
  return storage.deleteAthlete(id);
}

// Committee
export async function fetchCommittee() {
  return storage.getCommittee();
}

export async function createCommittee(data: any) {
  return storage.createCommittee(data);
}

export async function updateCommittee(id: string, data: any) {
  return storage.updateCommittee(id, data);
}

export async function deleteCommittee(id: string) {
  return storage.deleteCommittee(id);
}

// Tournaments
export async function fetchTournaments() {
  return storage.getTournaments();
}

export async function fetchTournament(id: string) {
  return storage.getTournament(id);
}

export async function createTournament(data: any) {
  return storage.createTournament(data);
}

export async function updateTournament(id: string, data: any) {
  return storage.updateTournament(id, data);
}

export async function deleteTournament(id: string) {
  return storage.deleteTournament(id);
}

// Matches
export async function fetchMatches() {
  return storage.getMatches();
}

export async function fetchMatch(id: string) {
  return storage.getMatch(id);
}

export async function createMatch(data: any) {
  return storage.createMatch(data);
}

export async function updateMatch(id: string, data: any) {
  return storage.updateMatch(id, data);
}

export async function deleteMatch(id: string) {
  return storage.deleteMatch(id);
}

// Backup
export async function exportData() {
  return storage.getBackup();
}

export async function importData(data: any): Promise<{ success: boolean; error?: string }> {
  try {
    await storage.restoreBackup(data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
