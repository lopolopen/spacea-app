ARG NODE_IMAGE=node:10

FROM nginx:alpine as base
EXPOSE 80

WORKDIR /etc/nginx/conf.d
RUN rm -rf ./*
COPY ["default.conf", "default.conf"]

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY . .
RUN yarn install && yarn run build

FROM base AS final
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/build .
ENTRYPOINT ["nginx", "-g", "daemon off;"]
