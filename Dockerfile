FROM node:20.11.0 AS node
WORKDIR /home/node
COPY ./package.json .
COPY ./package-lock.json .
RUN chown -R node:node /home/node
USER node
RUN npm i
COPY . .
RUN npm run build

FROM nginx
EXPOSE 8080
COPY --from=node /home/node/dist/proxmox-client/browser /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
RUN chown -R nginx:nginx /var/log/nginx
RUN chown -R nginx:nginx /etc/nginx
