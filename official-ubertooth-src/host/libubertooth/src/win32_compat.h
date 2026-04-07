#ifndef __WIN32_COMPAT_H__
#define __WIN32_COMPAT_H__

#ifdef _WIN32
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <windows.h>
#include <signal.h>
#include <bluetoothapis.h>

#ifndef SIGQUIT
#define SIGQUIT SIGTERM
#endif

#ifndef SIGALRM
#define SIGALRM SIGTERM
#endif

// Define usleep replacement
#ifndef _UNISTD_H
static inline int win32_usleep(unsigned int microseconds) {
    Sleep(microseconds / 1000);
    return 0;
}
#define usleep(us) win32_usleep(us)
#endif

// bdaddr_t and related stubs for BlueZ compatibility
typedef struct {
	uint8_t b[6];
} bdaddr_t;

#ifndef AF_BLUETOOTH
#define AF_BLUETOOTH 31
#endif

#define BACPY(dst, src) memcpy(dst, src, 6)
#define BACMP(a, b) memcmp(a, b, 6)
#define BAZERO(a) memset(a, 0, 6)

static inline int bacpy(bdaddr_t *dst, const bdaddr_t *src) {
    memcpy(dst, src, sizeof(bdaddr_t));
    return 0;
}

static inline int str2ba(const char *str, bdaddr_t *ba) {
    unsigned int b[6];
    if (sscanf(str, "%02X:%02X:%02X:%02X:%02X:%02X", &b[5], &b[4], &b[3], &b[2], &b[1], &b[0]) != 6)
        return -1;
    for (int i = 0; i < 6; i++) ba->b[i] = (uint8_t)b[i];
    return 0;
}

static inline int ba2str(const bdaddr_t *ba, char *str) {
    return sprintf(str, "%02X:%02X:%02X:%02X:%02X:%02X", ba->b[5], ba->b[4], ba->b[3], ba->b[2], ba->b[1], ba->b[0]);
}

// Windows Bluetooth API helpers
static inline int win32_get_local_bdaddr(bdaddr_t *ba) {
    HANDLE hRadio;
    BLUETOOTH_FIND_RADIO_PARAMS radioParams = { sizeof(BLUETOOTH_FIND_RADIO_PARAMS) };
    HBLUETOOTH_RADIO_FIND hFind = BluetoothFindFirstRadio(&radioParams, &hRadio);
    if (hFind != NULL) {
        BLUETOOTH_RADIO_INFO radioInfo = { sizeof(BLUETOOTH_RADIO_INFO) };
        if (BluetoothGetRadioInfo(hRadio, &radioInfo) == ERROR_SUCCESS) {
            for (int i = 0; i < 6; i++) ba->b[i] = radioInfo.address.rgBytes[i];
            BluetoothFindRadioClose(hFind);
            CloseHandle(hRadio);
            return 0;
        }
        BluetoothFindRadioClose(hFind);
        CloseHandle(hRadio);
    }
    return -1;
}

typedef struct { bdaddr_t bdaddr; } inquiry_info;

static inline int win32_hci_inquiry(int max_rsp, inquiry_info **ii) {
    BLUETOOTH_DEVICE_SEARCH_PARAMS searchParams = {
        sizeof(BLUETOOTH_DEVICE_SEARCH_PARAMS),
        TRUE, TRUE, TRUE, TRUE, TRUE,
        10, // timeout in 1.28s units
        NULL
    };
    BLUETOOTH_DEVICE_INFO deviceInfo = { sizeof(BLUETOOTH_DEVICE_INFO) };
    HBLUETOOTH_DEVICE_FIND hFind = BluetoothFindFirstDevice(&searchParams, &deviceInfo);
    
    int num_rsp = 0;
    *ii = (inquiry_info*)malloc(max_rsp * sizeof(inquiry_info));
    if (*ii == NULL) return -1;

    if (hFind != NULL) {
        do {
            if (num_rsp < max_rsp) {
                for (int i = 0; i < 6; i++) (*ii)[num_rsp].bdaddr.b[i] = deviceInfo.Address.rgBytes[i];
                num_rsp++;
            }
        } while (BluetoothFindNextDevice(hFind, &deviceInfo));
        BluetoothFindDeviceClose(hFind);
    }
    return num_rsp;
}

#define err(exit_code, ...) do { \
    fprintf(stderr, __VA_ARGS__); \
    fprintf(stderr, ": %s\n", strerror(errno)); \
    exit(exit_code); \
} while (0)

#define errx(exit_code, ...) do { \
    fprintf(stderr, __VA_ARGS__); \
    fprintf(stderr, "\n"); \
    exit(exit_code); \
} while (0)

#define warn(...) do { \
    fprintf(stderr, __VA_ARGS__); \
    fprintf(stderr, ": %s\n", strerror(errno)); \
} while (0)

#define warnx(...) do { \
    fprintf(stderr, __VA_ARGS__); \
    fprintf(stderr, "\n"); \
} while (0)

static inline unsigned int alarm(unsigned int seconds) {
    (void)seconds;
    return 0;
}

#else
#include <err.h>
#endif

#endif /* __WIN32_COMPAT_H__ */
