export type BulkEntity = 'teams' | 'athletes' | 'committee' | 'tournaments' | 'matches';

export const CSV_TEMPLATES: Record<BulkEntity, string> = {
  teams: 'id,fullname,shortname,main_color\nLAL,Los Angeles Lakers,Lakers,#552583\n',
  athletes: 'id,fullname,surname,date_of_birth,team_id\n123456789,LeBron James,James,30/12/1984,LAL\n',
  committee: 'id,fullname,surname,team_id\n987654321,JJ Redick,Redick,LAL\n',
  tournaments: 'id,fullname,shortname,season,main_color\nNBA 26,NBA,NBA,26,#f97316\n',
  matches: 'id,tournament_id,date,phase,round,team_a_id,team_b_id\n,NBA 26,20/08/2026,Group Stage,Round 1,LAL,BOS\n',
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      out.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  out.push(current);
  return out;
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] || '').trim().replace(/^"|"$/g, '');
    });
    return row;
  }).filter((row) => Object.values(row).some((value) => value));
}

export function normalizeDate(value: string): string {
  if (!value) return value;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const match = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    return `${match[3]}-${month}-${day}`;
  }
  return value;
}

function generateMatchId(): string {
  return `GAME-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function csvRowsToBackup(entity: BulkEntity, rows: Record<string, string>[]) {
  const backup: Record<string, any[]> = {
    teams: [],
    athletes: [],
    committee: [],
    tournaments: [],
    matches: [],
  };

  if (entity === 'teams') {
    backup.teams = rows.map((row) => ({
      id: row.id,
      fullname: row.fullname,
      shortname: row.shortname,
      main_color: row.main_color || '#f97316',
      logotype: row.logotype || null,
    }));
  }

  if (entity === 'athletes') {
    backup.athletes = rows.map((row) => ({
      id: row.id,
      fullname: row.fullname,
      surname: row.surname,
      date_of_birth: normalizeDate(row.date_of_birth || row.dob || ''),
      team_id: row.team_id || null,
    }));
  }

  if (entity === 'committee') {
    backup.committee = rows.map((row) => ({
      id: row.id,
      fullname: row.fullname,
      surname: row.surname,
      team_id: row.team_id || null,
    }));
  }

  if (entity === 'tournaments') {
    backup.tournaments = rows.map((row) => ({
      id: row.id || `${row.fullname} ${row.season}`.toUpperCase(),
      fullname: row.fullname,
      shortname: row.shortname,
      season: row.season,
      main_color: row.main_color || '#f97316',
      logotype: row.logotype || null,
    }));
  }

  if (entity === 'matches') {
    backup.matches = rows.map((row) => {
      const id = row.id || generateMatchId();
      return {
        id,
        code: row.code || id,
        tournament_id: row.tournament_id,
        date: normalizeDate(row.date),
        phase: row.phase,
        round: row.round,
        team_a_id: row.team_a_id,
        team_b_id: row.team_b_id,
      };
    });
  }

  return backup;
}

export function downloadCsvTemplate(entity: BulkEntity) {
  const blob = new Blob([CSV_TEMPLATES[entity]], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sumulasys_${entity}_template.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
