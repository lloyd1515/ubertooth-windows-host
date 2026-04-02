/*
 * Windows proof-build stubs for libbtbb PCAP/PCAPNG functions.
 *
 * These let the official Ubertooth host tools link on native Windows
 * without pulling in the POSIX-specific capture implementation
 * (endian.h, sys/mman.h, etc.). They are intentionally minimal and
 * only exist to prove a native Windows build path for tools like
 * ubertooth-dfu and ubertooth-util, which do not rely on packet-capture
 * functionality.
 */

#include "btbb.h"

int btbb_pcapng_create_file(const char *filename, const char *interface_desc, btbb_pcapng_handle **ph)
{
	(void) filename;
	(void) interface_desc;
	if (ph) {
		*ph = 0;
	}
	return -1;
}

int btbb_pcapng_append_packet(btbb_pcapng_handle *h, const uint64_t ns,
                              const int8_t sigdbm, const int8_t noisedbm,
                              const uint32_t reflap, const uint8_t refuap,
                              const btbb_packet *pkt)
{
	(void) h;
	(void) ns;
	(void) sigdbm;
	(void) noisedbm;
	(void) reflap;
	(void) refuap;
	(void) pkt;
	return -1;
}

int btbb_pcapng_record_bdaddr(btbb_pcapng_handle *h, const uint64_t bdaddr,
                              const uint8_t uapmask, const uint8_t napvalid)
{
	(void) h;
	(void) bdaddr;
	(void) uapmask;
	(void) napvalid;
	return -1;
}

int btbb_pcapng_record_btclock(btbb_pcapng_handle *h, const uint64_t bdaddr,
                               const uint64_t ns, const uint32_t clk, const uint32_t clkmask)
{
	(void) h;
	(void) bdaddr;
	(void) ns;
	(void) clk;
	(void) clkmask;
	return -1;
}

int btbb_pcapng_close(btbb_pcapng_handle *h)
{
	(void) h;
	return -1;
}

int lell_pcapng_create_file(const char *filename, const char *interface_desc, lell_pcapng_handle **ph)
{
	(void) filename;
	(void) interface_desc;
	if (ph) {
		*ph = 0;
	}
	return -1;
}

int lell_pcapng_append_packet(lell_pcapng_handle *h, const uint64_t ns,
                              const int8_t sigdbm, const int8_t noisedbm,
                              const uint32_t refAA, const lell_packet *pkt)
{
	(void) h;
	(void) ns;
	(void) sigdbm;
	(void) noisedbm;
	(void) refAA;
	(void) pkt;
	return -1;
}

int lell_pcapng_record_connect_req(lell_pcapng_handle *h, const uint64_t ns, const uint8_t *pdu)
{
	(void) h;
	(void) ns;
	(void) pdu;
	return -1;
}

int lell_pcapng_close(lell_pcapng_handle *h)
{
	(void) h;
	return -1;
}

int btbb_pcap_create_file(const char *filename, btbb_pcap_handle **ph)
{
	(void) filename;
	if (ph) {
		*ph = 0;
	}
	return -1;
}

int btbb_pcap_append_packet(btbb_pcap_handle *h, const uint64_t ns,
                            const int8_t sigdbm, const int8_t noisedbm,
                            const uint32_t reflap, const uint8_t refuap,
                            const btbb_packet *pkt)
{
	(void) h;
	(void) ns;
	(void) sigdbm;
	(void) noisedbm;
	(void) reflap;
	(void) refuap;
	(void) pkt;
	return -1;
}

int btbb_pcap_close(btbb_pcap_handle *h)
{
	(void) h;
	return -1;
}

int lell_pcap_create_file(const char *filename, lell_pcap_handle **ph)
{
	(void) filename;
	if (ph) {
		*ph = 0;
	}
	return -1;
}

int lell_pcap_ppi_create_file(const char *filename, int btle_ppi_version, lell_pcap_handle **ph)
{
	(void) filename;
	(void) btle_ppi_version;
	if (ph) {
		*ph = 0;
	}
	return -1;
}

int lell_pcap_append_packet(lell_pcap_handle *h, const uint64_t ns,
                            const int8_t sigdbm, const int8_t noisedbm,
                            const uint32_t refAA, const lell_packet *pkt)
{
	(void) h;
	(void) ns;
	(void) sigdbm;
	(void) noisedbm;
	(void) refAA;
	(void) pkt;
	return -1;
}

int lell_pcap_append_ppi_packet(lell_pcap_handle *h, const uint64_t ns,
                                const uint8_t clkn_high,
                                const int8_t rssi_min, const int8_t rssi_max,
                                const int8_t rssi_avg, const uint8_t rssi_count,
                                const lell_packet *pkt)
{
	(void) h;
	(void) ns;
	(void) clkn_high;
	(void) rssi_min;
	(void) rssi_max;
	(void) rssi_avg;
	(void) rssi_count;
	(void) pkt;
	return -1;
}

int lell_pcap_close(lell_pcap_handle *h)
{
	(void) h;
	return -1;
}
