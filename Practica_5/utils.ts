import { Collection, ObjectId } from "mongodb";
import { Course, CourseGQ, CourseModel, Student, StudentGQ, StudentModel, Teacher, TeacherGQ, TeacherModel } from "./types.ts";

export const formModelToStudent = (StudentModel: StudentModel): Student => {
    return {
        id: StudentModel._id!.toString(),
        name: StudentModel.name,
        email: StudentModel.email,
        enrolledCourses: StudentModel.enrolledCourses,
    };
};

export const formModelToTeacher = (TeacherModel: TeacherModel): Teacher => {
    return {
        id: TeacherModel._id!.toString(),
        name: TeacherModel.name,
        email: TeacherModel.email,
        coursesTaught: TeacherModel.coursesTaught,
    };
};

export const formModelToCourse = (CourseModel: CourseModel): Course => {
    return {
        id: CourseModel._id!.toString(),
        title: CourseModel.title,
        description: CourseModel.description,
        teacherId: CourseModel.teacherId,
        studentIds: CourseModel.studentIds,
    };
};

export const formModelToStudentGQ = async (StudentModel: StudentModel, CourseCollection: Collection<CourseModel>): Promise<StudentGQ> => {

    const courses = await CourseCollection.find({
        _id: {
            $in: StudentModel.enrolledCourses.map(id => new ObjectId(id))
        }
      }).toArray()
    const enrolled = courses.map((p)=> formModelToCourse(p))
    return {
        id: StudentModel._id!.toString(),
        name: StudentModel.name,
        email: StudentModel.email,
        enrolledCourses: enrolled,
    };
};

export const formModelToTeacherGQ = async (
    TeacherModel: TeacherModel, 
    CourseCollection: Collection<CourseModel>
): Promise<TeacherGQ> => {
    const courses = await CourseCollection.find({
        _id: {
            $in: TeacherModel.coursesTaught.map(id => new ObjectId(id))
        }
      }).toArray()
    const taught = courses.map((p)=> formModelToCourse(p))

    return {
        id: TeacherModel._id!.toString(),
        name: TeacherModel.name,
        email: TeacherModel.email,
        coursesTaught: taught,
    };
};

export const formModelToCourseGQ = async (
    CourseModel: CourseModel, 
    StudentCollection: Collection<StudentModel>, 
    TeacherCollection: Collection<TeacherModel>
): Promise<CourseGQ> => {
    const students = await StudentCollection.find({
        _id: {
            $in: CourseModel.studentIds.map(id => new ObjectId(id))
        }
      }).toArray()
    const studentM = students.map((p)=> formModelToStudent(p))
    
    const teacherids = await TeacherCollection.findOne({
        _id: new ObjectId(CourseModel.teacherId)
      })
    if (!teacherids) {
        throw new Error(`Teacher with ID ${CourseModel.teacherId} not found.`);
    }
    const teacherM = formModelToTeacher(teacherids)
    return {
        id: CourseModel._id!.toString(),
        title: CourseModel.title,
        description: CourseModel.description,
        teacherId: teacherM,
        studentIds: studentM,
    };
};