function isNonEmptyString(value, minLength = 1) {
  return typeof value === "string" && value.trim().length >= minLength;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function validatePagination(query) {
  const parsedPage = Number(query.page || 1);
  const parsedLimit = Number(query.limit || 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0 && parsedLimit <= 50
      ? parsedLimit
      : 10;

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

function validateRegisterPayload(payload) {
  const errors = [];

  if (!isNonEmptyString(payload.name, 3)) {
    errors.push("name deve ter pelo menos 3 caracteres.");
  }

  if (!validateEmail(payload.email)) {
    errors.push("email deve ser valido.");
  }

  if (!isNonEmptyString(payload.password, 6)) {
    errors.push("password deve ter pelo menos 6 caracteres.");
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length
      ? null
      : {
          name: payload.name.trim(),
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
        },
  };
}

function validateLoginPayload(payload) {
  const errors = [];

  if (!validateEmail(payload.email)) {
    errors.push("email deve ser valido.");
  }

  if (!isNonEmptyString(payload.password, 1)) {
    errors.push("password e obrigatorio.");
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length
      ? null
      : {
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
        },
  };
}

function validateAuthorPayload(payload) {
  const errors = [];
  const currentYear = new Date().getFullYear();
  const birthYear =
    payload.birthYear === undefined || payload.birthYear === null || payload.birthYear === ""
      ? null
      : Number(payload.birthYear);

  if (!isNonEmptyString(payload.name, 3)) {
    errors.push("name deve ter pelo menos 3 caracteres.");
  }

  if (!isNonEmptyString(payload.country, 2)) {
    errors.push("country deve ter pelo menos 2 caracteres.");
  }

  if (
    birthYear !== null &&
    (!Number.isInteger(birthYear) || birthYear < 1500 || birthYear > currentYear)
  ) {
    errors.push(`birthYear deve estar entre 1500 e ${currentYear}.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length
      ? null
      : {
          name: payload.name.trim(),
          country: payload.country.trim(),
          birthYear,
        },
  };
}

function validateBookPayload(payload) {
  const errors = [];
  const currentYear = new Date().getFullYear() + 1;
  const publicationYear = Number(payload.publicationYear);
  const pages = Number(payload.pages);
  const authorId = Number(payload.authorId);
  const genreId = Number(payload.genreId);
  const normalizedStatus = String(payload.status || "").trim().toLowerCase();
  const allowedStatus = ["available", "borrowed", "maintenance"];

  if (!isNonEmptyString(payload.title, 2)) {
    errors.push("title deve ter pelo menos 2 caracteres.");
  }

  if (
    !isNonEmptyString(payload.isbn, 10) ||
    !/^[0-9A-Za-z-]+$/.test(payload.isbn)
  ) {
    errors.push("isbn deve ter ao menos 10 caracteres alfanumericos.");
  }

  if (
    !Number.isInteger(publicationYear) ||
    publicationYear < 1450 ||
    publicationYear > currentYear
  ) {
    errors.push(`publicationYear deve estar entre 1450 e ${currentYear}.`);
  }

  if (!Number.isInteger(pages) || pages <= 0 || pages > 5000) {
    errors.push("pages deve ser um inteiro entre 1 e 5000.");
  }

  if (!allowedStatus.includes(normalizedStatus)) {
    errors.push(`status deve ser um de: ${allowedStatus.join(", ")}.`);
  }

  if (!Number.isInteger(authorId) || authorId <= 0) {
    errors.push("authorId deve ser um inteiro positivo.");
  }

  if (!Number.isInteger(genreId) || genreId <= 0) {
    errors.push("genreId deve ser um inteiro positivo.");
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length
      ? null
      : {
          title: payload.title.trim(),
          isbn: payload.isbn.trim(),
          publicationYear,
          pages,
          status: normalizedStatus,
          authorId,
          genreId,
        },
  };
}

module.exports = {
  validateAuthorPayload,
  validateBookPayload,
  validateLoginPayload,
  validatePagination,
  validateRegisterPayload,
};
