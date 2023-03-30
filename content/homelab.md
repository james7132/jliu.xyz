+++
title = "Homelab"

[extra]
use_toc = true
+++
I'm a huge proponent of personal data ownership, and avoiding reliance on public
cloud services, which may not have consumers' best interests in mind.

Since 2019, I've slowly been building out my own personal homelab.

# Hardware
All of my homelab

# Software
Almost all of the following software are hosted via
[OCI](https://opencontainers.org/) containers. Currently being managed via
[Docker](https://www.docker.com/), but I may eventually switch to
[Podman](https://podman.io/) instead.

## Automation
 - [Home Assistant](https://www.home-assistant.io/) - An all-in-one, self-hosted,
   privacy-oriented home automation solution.
 - [zwave.js](https://github.com/zwave-js) - A self-hosted service for managing a
   [Z-Wave](https://www.z-wave.com/) network of IoT devices.
 - [Gotify](https://gotify.net/) - A simple self-hosted service for sending push
   notifications to mobile devices.

## Network Management
 - [Unifi Controller](https://help.ui.com/hc/en-us/articles/360012282453-UniFi-Network-Self-Hosting-your-UniFi-Network-Without-a-Console-Advanced-) -
   Used to control and manage my home Wifi network and Ubiquiti devices.
 - [cloudflare-ddns](https://github.com/timothymiller/cloudflare-ddns) - A simple
   script for updating [CloudFlare](https://www.cloudflare.com/) DNS records to
   ensure that my DNS entries are pointed at my home network.

## Media
 - [Jellyfin](https://jellyfin.org/) - Media Server for TV shows, movies, etc.
 - [Transmission](https://transmissionbt.com/) - BitTorrent Client with a web
   interface/API.
 - [Sonarr](https://sonarr.tv/) - Internet-based PVR. Used to automate fetching
   TV shows with Transmission. Notifications sent to mobile via Gotify.
 - [Radarr](https://radarr.video/) - Sonarr, but for movies. Notifications sent
   to mobile via Gotify.
 - [Jackett](https://github.com/Jackett/Jackett) - A Sonarr/Radarr indexer for
   various BitTorrent trackers.

## Data Backup and File Management
 - [SMB](https://en.wikipedia.org/wiki/Server_Message_Block) - Synology comes, by
   default, with a built in SMB3 server.
 - [Gitea](https://gitea.io/en-us/) - A self-hosted alternative to GitHub. I
   primarily use it with a cronjob to automatically backup all repos I interact
   with on GitHub.
 - [PostgreSQL](https://www.postgresql.org/) - The go-to industry solution for
   relational databases. Backs much of the other services in this list like Home
   Assistant, Gitea, and Hastebin.

## Personal Apps
 - [Vikunja](https://vikunja.io/) - A self-hosted alternative to
   [Todoist](https://todoist.com/). I use it primarily for personal task
   management.
 - [Hastebin](https://github.com/toptal/haste-server) - A simple pastebin
   alternative for sharing text dumps.
 - I self-host a personal file server, which is publicly readable at
   https://files.jliu.xyz via SMB with [nginx](https://www.nginx.com/).
 - I've set up [ShareX](https://getsharex.com/) to upload screenshots to
   https://i.jliu.xyz/ using the same upload path through SMB.

## Monitoring
 - [Grafana](https://grafana.com/) - A dashboarding service that integrates with
   both Prometheus and Postgre.
 - [Prometheus](https://prometheus.io/) - A time-series database and metrics
   management solution. Integrates with almost all of my other containers for
   monitoring their long term state.

## DNS

TODO: Complete this section
