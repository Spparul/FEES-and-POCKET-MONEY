export function formatStandard(std?: string): string {
  if (!std) return '—';
  const clean = std.trim().toUpperCase();
  if (clean === 'VIII' || clean === '8' || clean === 'FORM 1') return 'Form 1';
  if (clean === 'IX' || clean === '9' || clean === 'FORM 2') return 'Form 2';
  if (clean === 'X' || clean === '10' || clean === 'FORM 3') return 'Form 3';
  if (clean === 'XI' || clean === '11') return '11';
  if (clean === 'XII' || clean === '12') return '12';
  return std;
}

export function formatCategory(cat?: string): string {
  if (!cat) return '—';
  if (cat === 'DAY_SCHOLAR') return 'Day Scholar';
  if (cat === 'HOSTEL_SPECIAL') return 'Special Boarder';
  return 'Ordinary Boarder';
}
