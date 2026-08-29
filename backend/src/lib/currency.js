/** Ghana Cedis (GHS) formatting */
function formatMoney(amount) {
  const num = Number(amount) || 0;
  return `₵${num.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

module.exports = { formatMoney };
