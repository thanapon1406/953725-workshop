import { faker, fakerTH } from '@faker-js/faker';

// Same seed on every test → the same fake names and national ids every run.
// When a test fails because of generated data, it fails the same way twice,
// so the failure can actually be reproduced (and reviewed).
faker.seed(20261003);
fakerTH.seed(20261003);
