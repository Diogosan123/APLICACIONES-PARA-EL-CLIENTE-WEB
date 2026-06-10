const STORAGE_KEY = "registroEstudiantes";

const form = document.getElementById("studentForm");
const formTitle = document.getElementById("formTitle");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const clearAllButton = document.getElementById("clearAllButton");
const searchInput = document.getElementById("searchInput");
const tableBody = document.getElementById("studentsTableBody");
const rowTemplate = document.getElementById("studentRowTemplate");
const tableCard = document.getElementById("tableCard");
const emptyState = document.getElementById("emptyState");
const editingId = document.getElementById("editingId");
const headerCount = document.getElementById("headerCount");

const fields = {
  cedula: document.getElementById("cedula"),
  apellidos: document.getElementById("apellidos"),
  nombres: document.getElementById("nombres"),
  direccion: document.getElementById("direccion"),
  telefono: document.getElementById("telefono"),
  correo: document.getElementById("correo"),
  facultad: document.getElementById("facultad"),
  nivel: document.getElementById("nivel"),
  paralelo: document.getElementById("paralelo")
};

const errors = {
  cedula: document.getElementById("cedulaError"),
  apellidos: document.getElementById("apellidosError"),
  nombres: document.getElementById("nombresError"),
  direccion: document.getElementById("direccionError"),
  telefono: document.getElementById("telefonoError"),
  correo: document.getElementById("correoError"),
  facultad: document.getElementById("facultadError"),
  nivel: document.getElementById("nivelError"),
  paralelo: document.getElementById("paraleloError")
};

const regex = {
  cedula: /^\d{10}$/,
  nombres: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/,
  direccion: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9#.,°\-/ ]{8,80}$/,
  telefono: /^0\d{8,9}$/,
  correo: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  nivel: /^(?:[1-9]|10)$/,
  paralelo: /^[A-D]$/
};

let students = loadStudents();

function loadStudents() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `student-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function getFormData() {
  return {
    id: editingId.value || createId(),
    cedula: normalizeText(fields.cedula.value),
    apellidos: normalizeText(fields.apellidos.value),
    nombres: normalizeText(fields.nombres.value),
    direccion: normalizeText(fields.direccion.value),
    telefono: normalizeText(fields.telefono.value),
    correo: normalizeText(fields.correo.value).toLowerCase(),
    facultad: fields.facultad.value,
    nivel: fields.nivel.value,
    paralelo: fields.paralelo.value
  };
}

function setError(fieldName, message) {
  const field = fields[fieldName];
  const wrapper = field.closest(".field");
  wrapper.classList.toggle("invalid", Boolean(message));
  field.setAttribute("aria-invalid", String(Boolean(message)));
  errors[fieldName].textContent = message;
}

function clearErrors() {
  Object.keys(fields).forEach((fieldName) => setError(fieldName, ""));
}

function isValidCedulaChecksum(cedula) {
  const province = Number(cedula.slice(0, 2));
  const thirdDigit = Number(cedula[2]);

  if (province < 1 || province > 24 || thirdDigit > 5) {
    return false;
  }

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const sum = coefficients.reduce((total, coefficient, index) => {
    const product = Number(cedula[index]) * coefficient;
    return total + (product > 9 ? product - 9 : product);
  }, 0);
  const verifier = sum % 10 === 0 ? 0 : 10 - (sum % 10);

  return verifier === Number(cedula[9]);
}

function validateStudent(student) {
  clearErrors();
  let isValid = true;

  if (!regex.cedula.test(student.cedula)) {
    setError("cedula", "La cédula debe tener exactamente 10 dígitos.");
    isValid = false;
  } else if (!isValidCedulaChecksum(student.cedula)) {
    setError("cedula", "La cédula ingresada no es válida.");
    isValid = false;
  } else if (students.some((item) => item.cedula === student.cedula && item.id !== student.id)) {
    setError("cedula", "Ya existe un estudiante con esta cédula.");
    isValid = false;
  }

  if (!regex.nombres.test(student.apellidos) || student.apellidos.length < 3 || student.apellidos.length > 50) {
    setError("apellidos", "Ingrese apellidos válidos, solo letras y espacios.");
    isValid = false;
  }

  if (!regex.nombres.test(student.nombres) || student.nombres.length < 3 || student.nombres.length > 50) {
    setError("nombres", "Ingrese nombres válidos, solo letras y espacios.");
    isValid = false;
  }

  if (!regex.direccion.test(student.direccion)) {
    setError("direccion", "La dirección debe tener entre 8 y 80 caracteres válidos.");
    isValid = false;
  }

  if (!regex.telefono.test(student.telefono)) {
    setError("telefono", "El teléfono debe iniciar con 0 y tener 9 o 10 dígitos.");
    isValid = false;
  }

  if (!regex.correo.test(student.correo)) {
    setError("correo", "Ingrese un correo electrónico válido.");
    isValid = false;
  } else if (students.some((item) => item.correo === student.correo && item.id !== student.id)) {
    setError("correo", "Ya existe un estudiante con este correo.");
    isValid = false;
  }

  if (!student.facultad) {
    setError("facultad", "Seleccione una facultad.");
    isValid = false;
  }

  if (!regex.nivel.test(student.nivel)) {
    setError("nivel", "Seleccione un nivel válido.");
    isValid = false;
  }

  if (!regex.paralelo.test(student.paralelo)) {
    setError("paralelo", "Seleccione un paralelo válido.");
    isValid = false;
  }

  return isValid;
}

function resetForm() {
  form.reset();
  editingId.value = "";
  formTitle.textContent = "Nuevo estudiante";
  submitButton.textContent = "Guardar estudiante";
  cancelEditButton.classList.add("hidden");
  clearErrors();
}

function setFormValues(student) {
  editingId.value = student.id;
  fields.cedula.value = student.cedula;
  fields.apellidos.value = student.apellidos;
  fields.nombres.value = student.nombres;
  fields.direccion.value = student.direccion;
  fields.telefono.value = student.telefono;
  fields.correo.value = student.correo;
  fields.facultad.value = student.facultad;
  fields.nivel.value = student.nivel;
  fields.paralelo.value = student.paralelo;
  formTitle.textContent = "Editar estudiante";
  submitButton.textContent = "Actualizar estudiante";
  cancelEditButton.classList.remove("hidden");
  clearErrors();
  fields.cedula.focus();
}

function addOrUpdateStudent(student) {
  const index = students.findIndex((item) => item.id === student.id);

  if (index >= 0) {
    students[index] = student;
  } else {
    students.push(student);
  }

  students.sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es"));
  saveStudents();
  renderStudents();
  resetForm();
}

function getFilteredStudents() {
  const query = normalizeText(searchInput.value).toLowerCase();

  if (!query) {
    return students;
  }

  return students.filter((student) => {
    const searchableText = [
      student.cedula,
      student.apellidos,
      student.nombres,
      student.telefono,
      student.correo,
      student.facultad,
      student.nivel,
      student.paralelo
    ].join(" ").toLowerCase();

    return searchableText.includes(query);
  });
}

function renderStudents() {
  const filteredStudents = getFilteredStudents();
  tableBody.innerHTML = "";
  headerCount.textContent = String(students.length);
  emptyState.textContent = students.length
    ? "No hay coincidencias para la búsqueda actual."
    : "Aún no existen estudiantes registrados.";

  filteredStudents.forEach((student) => {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector(".student-cedula").textContent = student.cedula;
    row.querySelector(".student-name").textContent = `${student.apellidos} ${student.nombres}`;
    row.querySelector(".student-address").textContent = student.direccion;
    row.querySelector(".student-phone").textContent = student.telefono;
    row.querySelector(".student-email").textContent = student.correo;
    row.querySelector(".student-faculty").textContent = student.facultad;
    row.querySelector(".student-level").textContent = student.nivel;
    row.querySelector(".student-parallel").textContent = student.paralelo;
    row.querySelector(".edit-button").addEventListener("click", () => setFormValues(student));
    row.querySelector(".delete-button").addEventListener("click", () => deleteStudent(student.id));
    tableBody.appendChild(row);
  });

  tableCard.classList.toggle("is-empty", filteredStudents.length === 0);
}

function deleteStudent(id) {
  const student = students.find((item) => item.id === id);

  if (!student || !confirm(`¿Eliminar el registro de ${student.apellidos} ${student.nombres}?`)) {
    return;
  }

  students = students.filter((item) => item.id !== id);
  saveStudents();

  if (editingId.value === id) {
    resetForm();
  }

  renderStudents();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const student = getFormData();

  if (validateStudent(student)) {
    addOrUpdateStudent(student);
  }
});

form.addEventListener("reset", () => {
  setTimeout(resetForm, 0);
});

Object.entries(fields).forEach(([fieldName, field]) => {
  const revalidate = () => {
    if (errors[fieldName].textContent) {
      validateStudent(getFormData());
    }
  };

  field.addEventListener("input", revalidate);
  field.addEventListener("change", revalidate);
});

cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderStudents);

clearAllButton.addEventListener("click", () => {
  if (!students.length || !confirm("¿Desea eliminar todos los registros guardados?")) {
    return;
  }

  students = [];
  saveStudents();
  resetForm();
  renderStudents();
});

renderStudents();
