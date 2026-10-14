# Liquibase image with the changelog baked in.
# Baking (instead of bind-mounting) keeps it working the same way on laptops,
# GitHub Actions, GitLab docker-in-docker and Jenkins agents.
FROM liquibase/liquibase:5.0.4

# Liquibase 5 no longer bundles JDBC drivers — install the PostgreSQL one.
RUN lpm add postgresql --global

COPY changelog /liquibase/changelog
WORKDIR /liquibase/changelog
