import { storage } from './storage';

// Helper to simulate async behavior
const asyncWrapper = async <T>(fn: () => T): Promise<T> => {
  return new Promise((resolve, reject) => {
    try {
      const result = fn();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

export const API_URL = ''; // Not used anymore

// Teams
export async function fetchTeams() {
  return asyncWrapper(() => storage.getTeams());
}

export async function fetchTeam(id: string) {
  return asyncWrapper(() => storage.getTeam(id));
}

export async function createTeam(data: any) {
  return asyncWrapper(() => storage.createTeam(data));
}

export async function updateTeam(id: string, data: any) {
  return asyncWrapper(() => storage.updateTeam(id, data));
}

export async function deleteTeam(id: string) {
  return asyncWrapper(() => storage.deleteTeam(id));
}

// Athletes
export async function fetchAthletes() {
  return asyncWrapper(() => storage.getAthletes());
}

export async function createAthlete(data: any) {
  return asyncWrapper(() => storage.createAthlete(data));
}

export async function updateAthlete(id: string, data: any) {
  return asyncWrapper(() => storage.updateAthlete(id, data));
}

export async function deleteAthlete(id: string) {
  return asyncWrapper(() => storage.deleteAthlete(id));
}

// Committee
export async function fetchCommittee() {
  return asyncWrapper(() => storage.getCommittee());
}

export async function createCommittee(data: any) {
  return asyncWrapper(() => storage.createCommittee(data));
}

export async function updateCommittee(id: string, data: any) {
  return asyncWrapper(() => storage.updateCommittee(id, data));
}

export async function deleteCommittee(id: string) {
  return asyncWrapper(() => storage.deleteCommittee(id));
}

// Tournaments
export async function fetchTournaments() {
  return asyncWrapper(() => storage.getTournaments());
}

export async function fetchTournament(id: string) {
  return asyncWrapper(() => storage.getTournament(id));
}

export async function createTournament(data: any) {
  return asyncWrapper(() => storage.createTournament(data));
}

export async function updateTournament(id: string, data: any) {
  return asyncWrapper(() => storage.updateTournament(id, data));
}

export async function deleteTournament(id: string) {
  return asyncWrapper(() => storage.deleteTournament(id));
}

// Matches
export async function fetchMatches() {
  return asyncWrapper(() => storage.getMatches());
}

export async function fetchMatch(id: string) {
  return asyncWrapper(() => storage.getMatch(id));
}

export async function createMatch(data: any) {
  return asyncWrapper(() => storage.createMatch(data));
}

export async function updateMatch(id: string, data: any) {
  return asyncWrapper(() => storage.updateMatch(id, data));
}

export async function deleteMatch(id: string) {
  return asyncWrapper(() => storage.deleteMatch(id));
}

// Backup
export async function exportData() {
  return asyncWrapper(() => storage.getBackup());
}

export async function importData(data: any): Promise<{ success: boolean; error?: string }> {
  return asyncWrapper(() => {
    storage.restoreBackup(data);
    return { success: true };
  });
}
