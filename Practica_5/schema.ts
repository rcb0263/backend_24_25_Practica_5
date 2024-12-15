export const schema = `#graphql

type Student {
  id: ID!
  name: String!
  email: String!
  enrolledCourses: [String!]!
}

type Teacher {
  id: ID!
  name: String!
  email: String!
  coursesTaught: [String!]!
}

type Course {
  id: ID!
  title: String!
  description: String!
  teacherId: String!
  studentIds: [String!]!
}

type StudentGQ {
  id: ID!
  name: String!
  email: String!
  enrolledCourses: [Course!]!
}

type TeacherGQ {
  id: ID!
  name: String!
  email: String!
  coursesTaught: [Course!]!
}

type CourseGQ {
  id: ID!
  title: String!
  description: String!
  teacherId: Teacher!
  studentIds: [Student!]!
}

type Query {
  students: [StudentGQ!]!     #Funciona
  student(id: ID!): StudentGQ     #Funciona
  teachers: [TeacherGQ!]!    #Funciona
  teacher(id: ID!): TeacherGQ    #Funciona
  courses: [CourseGQ!]!    #Funciona
  course(id: ID!): CourseGQ    #Funciona

}

type Mutation {
  # Crear entidades 
  createStudent(name: String!, email: String!) : StudentGQ!    #Funciona
  createTeacher(name: String!, email: String!) : TeacherGQ!    #Funciona
  createCourse(title: String!, description: String!, teacherId: ID!): CourseGQ!    #Funciona

  # Actualizar entidades 
  updateStudent(id: ID!, name: String, email: String): Student    #Funciona
  updateTeacher(id: ID!, name: String, email: String): Teacher    #Funciona
  updateCourse(id: ID!, title: String, description: String, teacherId: ID): Course    #Funciona

  # Añadir un estudiante a un curso (matricularlo) 
  enrollStudentInCourse(studentId: ID!, courseId: ID!): CourseGQ!     #Funciona
  removeStudentFromCourse(studentId: ID!, courseId: ID!): CourseGQ!     #Funciona

  # Eliminar entidades 
  deleteStudent(id: ID!): Boolean! 
  deleteTeacher(id: ID!): Boolean! 
  deleteCourse(id: ID!): Boolean!
}
`;
