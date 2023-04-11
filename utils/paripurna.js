/**
 * paripurna means 'completed' and it should be a final clean string
 * [paripurna] Arti paripurna di KBBI adalah: lengkap; penuh lengkap.
 */

module.exports = function() {
    return this.trim().replace(/\s\s+/g, ' ');
}