export const toYMD = (dmy: string) => {
  if (!dmy) return '';
  const parts = dmy.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dmy;
};

export const toDMY = (ymd: string) => {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return ymd;
};

export const handleDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length >= 5) {
    v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 8)}`;
  } else if (v.length >= 3) {
    v = `${v.slice(0, 2)}/${v.slice(2)}`;
  }
  e.target.value = v;
  return v;
};
