
export const departments = [
  "Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula", "El Progreso", 
  "Escuintla", "Guatemala", "Huehuetenango", "Izabal", "Jalapa", "Jutiapa", 
  "Petén", "Quetzaltenango", "Quiché", "Retalhuleu", "Sacatepéquez", "San Marcos", 
  "Santa Rosa", "Sololá", "Suchitepéquez", "Totonicapán", "Zacapa"
];

export const municipalities: { [key: string]: string[] } = {
  "Alta Verapaz": ["Chahal", "Chisec", "Cobán", "Fray Bartolomé de las Casas", "Lanquín", "Panzós", "Raxruhá", "San Cristóbal Verapaz", "San Juan Chamelco", "San Pedro Carchá", "Santa Catalina la Tinta", "Santa Cruz Verapaz", "Senahú", "Tactic", "Tamahú", "Tucurú", "Santa María Cahabón"],
  "Baja Verapaz": ["Cubulco", "Granados", "Purulhá", "Rabinal", "Salamá", "San Jerónimo", "San Miguel Chicaj", "Santa Cruz el Chol"],
  "Chimaltenango": ["Acatenango", "Chimaltenango", "Comalapa", "El Tejar", "Parramos", "Patzicía", "Patzún", "Pochuta", "San Andrés Itzapa", "San José Poaquil", "San Martín Jilotepeque", "Santa Apolonia", "Santa Cruz Balanyá", "Tecpán Guatemala", "Yepocapa", "Zaragoza"],
  "Chiquimula": ["Camotán", "Chiquimula", "Concepción Las Minas", "Esquipulas", "Ipala", "Jocotán", "Olopa", "Quezaltepeque", "San Jacinto", "San José la Arada", "San Juan Ermita"],
  "El Progreso": ["El Jícaro", "Guastatoya", "Morazán", "San Agustín Acasaguastlán", "San Antonio La Paz", "San Cristóbal Acasaguastlán", "Sanarate", "Sansare"],
  "Escuintla": ["Escuintla", "Guanagazapa", "Iztapa", "La Democracia", "La Gomera", "Masagua", "Nueva Concepción", "Palín", "San José", "San Vicente Pacaya", "Santa Lucía Cotzumalguapa", "Sipacate", "Siquinalá", "Tiquisate"],
  "Guatemala": ["Amatitlán", "Chinautla", "Chuarrancho", "Fraijanes", "Guatemala", "Mixco", "Palencia", "San José del Golfo", "San José Pinula", "San Juan Sacatepéquez", "San Miguel Petapa", "San Pedro Ayampuc", "San Pedro Sacatepéquez", "San Raymundo", "Santa Catarina Pinula", "Villa Canales", "Villa Nueva"],
  "Huehuetenango": ["Aguacatán", "Chiantla", "Colotenango", "Concepción Huista", "Cuilco", "Huehuetenango", "Ixtahuacán", "Jacaltenango", "La Democracia", "La Libertad", "Malacatancito", "Nentón", "San Antonio Huista", "San Gaspar Ixchil", "San Ildefonso Ixtahuacán", "San Juan Atitán", "San Juan Ixcoy", "San Mateo Ixtatán", "San Miguel Acatán", "San Pedro Necta", "San Pedro Soloma", "San Rafael La Independencia", "San Rafael Petzal", "San Sebastián Coatán", "San Sebastián Huehuetenango", "Santa Ana Huista", "Santa Bárbara", "Santa Cruz Barillas", "Santa Eulalia", "Santiago Chimaltenango", "Tectitán", "Todos Santos Cuchumatán", "Unión Cantinil"],
  "Izabal": ["El Estor", "Livingston", "Los Amates", "Morales", "Puerto Barrios"],
  "Jalapa": ["Jalapa", "Mataquescuintla", "Monjas", "San Carlos Alzatate", "San Luis Jilotepeque", "San Manuel Chaparrón", "San Pedro Pinula"],
  "Jutiapa": ["Agua Blanca", "Asunción Mita", "Atescatempa", "Comapa", "Conguaco", "El Adelanto", "El Progreso", "Jalpatagua", "Jerez", "Jutiapa", "Moyuta", "Pasaco", "Quesada", "San José Acatempa", "Santa Catarina Mita", "Yupiltepeque", "Zapotitlán"],
  "Petén": ["Dolores", "Flores", "La Libertad", "Melchor de Mencos", "Poptún", "San Andrés", "San Benito", "San Francisco", "San José", "San Luis", "Santa Ana", "Sayaxché", "Las Cruces", "El Chal"],
  "Quetzaltenango": ["Almolonga", "Cabricán", "Cajolá", "Cantel", "Coatepeque", "Colomba", "Concepción Chiquirichapa", "El Palmar", "Flores Costa Cuca", "Génova", "Huitán", "La Esperanza", "Olintepeque", "Palestina de Los Altos", "Quetzaltenango", "Salcajá", "San Carlos Sija", "San Francisco La Unión", "San Juan Ostuncalco", "San Martín Sacatepéquez", "San Mateo", "San Miguel Sigüilá", "Sibilia", "Zunil"],
  "Quiché": ["Canillá", "Chajul", "Chicamán", "Chiché", "Chichicastenango", "Chinique", "Cunén", "Ixcán", "Joyabaj", "Nebaj", "Pachalum", "Patzité", "Sacapulas", "San Andrés Sajcabajá", "San Antonio Ilotenango", "San Bartolomé Jocotenango", "San Juan Cotzal", "San Miguel Uspantán", "San Pedro Jocopilas", "Santa Cruz del Quiché", "Zacualpa"],
  "Retalhuleu": ["Champerico", "El Asintal", "Nuevo San Carlos", "Retalhuleu", "San Andrés Villa Seca", "San Felipe", "San Martín Zapotitlán", "San Sebastián", "Santa Cruz Muluá"],
  "Sacatepéquez": ["Alotenango", "Antigua Guatemala", "Ciudad Vieja", "Jocotenango", "Magdalena Milpas Altas", "Pastores", "San Antonio Aguas Calientes", "San Bartolomé Milpas Altas", "San Lucas Sacatepéquez", "San Miguel Dueñas", "Santa Catarina Barahona", "Santa Lucía Milpas Altas", "Santa María de Jesús", "Santiago Sacatepéquez", "Santo Domingo Xenacoj", "Sumpango"],
  "San Marcos": ["Ayutla", "Catarina", "Comitancillo", "Concepción Tutuapa", "El Quetzal", "El Rodeo", "El Tumbador", "Esquipulas Palo Gordo", "Ixchiguán", "La Reforma", "Malacatán", "Nuevo Progreso", "Ocós", "Pajapita", "Río Blanco", "San Antonio Sacatepéquez", "San Cristóbal Cucho", "San José Ojetenam", "San Lorenzo", "San Marcos", "San Miguel Ixtahuacán", "San Pablo", "San Pedro Sacatepéquez", "San Rafael Pie de La Cuesta", "Sipacapa", "Sibinal", "Tacaná", "Tajumulco", "Tejutla"],
  "Santa Rosa": ["Barberena", "Casillas", "Chiquimulilla", "Cuilapa", "Guazacapán", "Nueva Santa Rosa", "Oratorio", "Pueblo Nuevo Viñas", "San Juan Tecuaco", "San Rafael Las Flores", "Santa Cruz Naranjo", "Santa María Ixhuatán", "Santa Rosa de Lima", "Taxisco"],
  "Sololá": ["Concepción", "Nahualá", "Panajachel", "San Andrés Semetabaj", "San Antonio Palopó", "San José Chacayá", "San Juan La Laguna", "San Lucas Tolimán", "San Marcos La Laguna", "San Pablo La Laguna", "San Pedro La Laguna", "Santa Catarina Ixtahuacán", "Santa Catarina Palopó", "Santa Clara La Laguna", "Santa Cruz La Laguna", "Santa Lucía Utatlán", "Santa María Visitación", "Santiago Atitlán", "Sololá"],
  "Suchitepéquez": ["Chicacao", "Cuyotenango", "Mazatenango", "Patulul", "Pueblo Nuevo", "Río Bravo", "Samayac", "San Antonio Suchitepéquez", "San Bernardino", "San Francisco Zapotitlán", "San Gabriel", "San José El Ídolo", "San Juan Bautista", "San Lorenzo", "San Miguel Panán", "San Pablo Jocopilas", "Santa Bárbara", "Santo Domingo Suchitepéquez", "Santo Tomás La Unión", "Zunilito"],
  "Totonicapán": ["Momostenango", "San Andrés Xecul", "San Bartolo", "San Cristóbal Totonicapán", "San Francisco El Alto", "Santa Lucía La Reforma", "Santa María Chiquimula", "Totonicapán"],
  "Zacapa": ["Cabañas", "Estanzuela", "Gualán", "Huité", "La Unión", "Río Hondo", "San Diego", "San Jorge", "Teculután", "Usumatlán", "Zacapa"]
};

export const roles = [
  "Biólogo Marino",
  "Técnico en Acuicultura",
  "Gerente de Producción",
  "Consultor Ambiental",
  "Proveedor de Alimentos",
  "Especialista en Sanidad Acuícola",
  "Investigador",
  "Especialista en Genética",
  "Operario de Granja",
  "Jefe de Planta de Procesamiento"
];
