#ifndef __WIN32_COMPAT_H__
#define __WIN32_COMPAT_H__

#ifdef _WIN32
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <windows.h>
#include <signal.h>

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
