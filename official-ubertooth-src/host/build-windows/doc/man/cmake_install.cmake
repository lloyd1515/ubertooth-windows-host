# Install script for directory: C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/doc/man

# Set the install prefix
if(NOT DEFINED CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX "C:/Program Files (x86)/ubertooth_all")
endif()
string(REGEX REPLACE "/$" "" CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")

# Set the install configuration name.
if(NOT DEFINED CMAKE_INSTALL_CONFIG_NAME)
  if(BUILD_TYPE)
    string(REGEX REPLACE "^[^A-Za-z0-9_]+" ""
           CMAKE_INSTALL_CONFIG_NAME "${BUILD_TYPE}")
  else()
    set(CMAKE_INSTALL_CONFIG_NAME "Release")
  endif()
  message(STATUS "Install configuration: \"${CMAKE_INSTALL_CONFIG_NAME}\"")
endif()

# Set the component getting installed.
if(NOT CMAKE_INSTALL_COMPONENT)
  if(COMPONENT)
    message(STATUS "Install component: \"${COMPONENT}\"")
    set(CMAKE_INSTALL_COMPONENT "${COMPONENT}")
  else()
    set(CMAKE_INSTALL_COMPONENT)
  endif()
endif()

# Is this installation the result of a crosscompile?
if(NOT DEFINED CMAKE_CROSSCOMPILING)
  set(CMAKE_CROSSCOMPILING "FALSE")
endif()

# Set path to fallback-tool for dependency-resolution.
if(NOT DEFINED CMAKE_OBJDUMP)
  set(CMAKE_OBJDUMP "C:/msys64/ucrt64/bin/objdump.exe")
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "doc" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/share/man/man1" TYPE FILE FILES
    "C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/doc/man/ubertooth-btle.1"
    "C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/doc/man/ubertooth-dump.1"
    "C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/doc/man/ubertooth-rx.1"
    "C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/doc/man/ubertooth-specan.1"
    "C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/doc/man/ubertooth-afh.1"
    "C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/doc/man/ubertooth-dfu.1"
    "C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/doc/man/ubertooth-ego.1"
    "C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/doc/man/ubertooth-scan.1"
    "C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/doc/man/ubertooth-util.1"
    )
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "doc" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/share/man/man7" TYPE FILE FILES "C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/doc/man/ubertooth.7")
endif()

string(REPLACE ";" "\n" CMAKE_INSTALL_MANIFEST_CONTENT
       "${CMAKE_INSTALL_MANIFEST_FILES}")
if(CMAKE_INSTALL_LOCAL_ONLY)
  file(WRITE "C:/Users/vlads/Desktop/AN3/Licenta/ubertooth-windows-host/official-ubertooth-src/host/build-windows/doc/man/install_local_manifest.txt"
     "${CMAKE_INSTALL_MANIFEST_CONTENT}")
endif()
