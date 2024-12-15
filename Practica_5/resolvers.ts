import { Collection, ObjectId } from "mongodb";
import { Course, CourseGQ, Student, StudentGQ, StudentModel, Teacher, TeacherGQ } from "./types.ts";
import { formModelToStudent, formModelToStudentGQ, formModelToTeacherGQ, formModelToCourseGQ, formModelToTeacher, formModelToCourse } from "./utils.ts";
import { TeacherModel } from "./types.ts";
import { CourseModel } from "./types.ts";

export const resolvers = {
  Query: {  
    student: async (
      _: unknown,
      { id }: { id: string },
      context: {
        StudentCollection: Collection<StudentModel>,
        CourseCollection: Collection<CourseModel>;
      },
    ): Promise<StudentGQ | null> => {
      const studentModel = await context.StudentCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!studentModel) {
        return null;
      }
      return formModelToStudentGQ(studentModel, context.CourseCollection);
    },
    teacher: async (
      _: unknown,
      { id }: { id: string },
      context: {
        TeacherCollection: Collection<TeacherModel>,
        CourseCollection: Collection<CourseModel>;
      },
    ): Promise<TeacherGQ | null> => {
      const teacherModel = await context.TeacherCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!teacherModel) {
        return null;
      }
      return formModelToTeacherGQ(teacherModel, context.CourseCollection);
    },
    course: async (
      _: unknown,
      { id }: { id: string },
      context: {
        TeacherCollection: Collection<TeacherModel>,
        CourseCollection: Collection<CourseModel>,
        StudentCollection: Collection<StudentModel>,
      },
    ): Promise<CourseGQ | null> => {
      const courseModel = await context.CourseCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!courseModel) {
        return null;
      }
      return formModelToCourseGQ(courseModel, context.StudentCollection, context.TeacherCollection);
    },
    students: async (
      _: unknown,
      __: unknown,
      context: { StudentCollection: Collection<StudentModel>, CourseCollection: Collection<CourseModel>  },
    ): Promise<StudentGQ[]> => {
      const studentModel = await context.StudentCollection.find().toArray();
      const courses = await Promise.all(
        studentModel.map((studentModel) =>
          formModelToStudentGQ(studentModel, context.CourseCollection)
        )
      );
      return courses;
    },
    teachers: async (
      _: unknown,
      __: unknown,
      context: { TeacherCollection: Collection<TeacherModel>, CourseCollection: Collection<CourseModel>  },
    ): Promise<TeacherGQ[]> => {
      const teacherModel = await context.TeacherCollection.find().toArray();
      const courses = await Promise.all(
        teacherModel.map((teacherModel) =>
          formModelToTeacherGQ(teacherModel, context.CourseCollection)
        )
      );
      return courses;
    },
    courses: async (
      _: unknown,
      __: unknown,
      context: { TeacherCollection: Collection<TeacherModel>, CourseCollection: Collection<CourseModel>,  StudentCollection: Collection<StudentModel>  },
    ): Promise<CourseGQ[]> => {
      const courseModel = await context.CourseCollection.find().toArray();
      const courses = await Promise.all(
        courseModel.map((courseModel) =>
          formModelToCourseGQ(courseModel, context.StudentCollection, context.TeacherCollection)
        )
      );
      return courses;
    },
    
  },
  Mutation: {
    updateStudent: async (
      _: unknown,
      args: { id: string; name: string; email: string },
      context: {
          StudentCollection: Collection<StudentModel>;
      },
    ): Promise<Student> => {
      const { id, name, email } = args;
      const studentModel = await context.StudentCollection.findOne({_id: new ObjectId(id)})
      if(!studentModel){
        throw new Error("no se encontró")
      }
      studentModel.name = name
      studentModel.email= email
      context.StudentCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: {name: studentModel.name, email: studentModel.email}}
      
      )

      return formModelToStudent(studentModel!);
    },
    updateTeacher: async (
      _: unknown,
      args: { id: string; name: string; email: string },
      context: {
        TeacherCollection: Collection<TeacherModel>;
      },
    ): Promise<Teacher> => {
      const { id, name, email } = args;
      const teacherModel = await context.TeacherCollection.findOne({_id: new ObjectId(id)})
      if(!teacherModel){
        throw new Error("no se encontró")
      }
      teacherModel.name = name
      teacherModel.email= email
      context.TeacherCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: {name: teacherModel.name, email: teacherModel.email}}
      
      )

      return formModelToTeacher(teacherModel!);
    },
    updateCourse: async (
      _: unknown,
      args: { id: string; title: string; description: string, teacherId: string },
      context: {
        TeacherCollection: Collection<TeacherModel>,
        CourseCollection: Collection<CourseModel>
      },
    ): Promise<Course> => {
      const { id, title, description, teacherId } = args;
      
      const courseModel = await context.CourseCollection.findOne({_id: new ObjectId(id)})
      if(!courseModel){
        throw new Error("no se encontró")
      }

      if(teacherId){
        const teacherModel = await context.TeacherCollection.findOne({_id: new ObjectId(courseModel?.teacherId)})

        if(teacherModel){
          teacherModel.coursesTaught = teacherModel.coursesTaught.filter(p => p !== id )
          await context.TeacherCollection.updateOne(
            {_id: new ObjectId(courseModel?.teacherId)},
            {$set: {coursesTaught: teacherModel.coursesTaught}}
          )
          courseModel.teacherId = teacherId

          const newTeacherModel = await context.TeacherCollection.findOne({ _id: new ObjectId(teacherId) });

          if (newTeacherModel) {
            newTeacherModel.coursesTaught.push(id);
            await context.TeacherCollection.updateOne(
              { _id: new ObjectId(teacherId) },
              { $set: { coursesTaught: newTeacherModel.coursesTaught } }
            );
          }
        }
    }

      if(title){
        courseModel.title = title
      }
      if(description){
        courseModel.description = description
      }
      await context.CourseCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: {title: courseModel.title, description: courseModel.description, teacherId: courseModel.teacherId}}
      )
      return formModelToCourse(courseModel!);
    },

    enrollStudentInCourse: async (
      _: unknown,
      args: { studentId: string; courseId: string },
      context: {
          StudentCollection: Collection<StudentModel>,
          CourseCollection: Collection<CourseModel>,
          TeacherCollection: Collection<TeacherModel>;

      },
    ): Promise<CourseGQ> => {
      const { studentId, courseId } = args;
      const studentModel = await context.StudentCollection.findOne({_id: new ObjectId(studentId)})
      if(!studentModel){
        throw new Error("no se encontró")
      }
      const courseModel = await context.CourseCollection.findOne({_id: new ObjectId(courseId)})
      if(!courseModel){
        throw new Error("no se encontró")
      }
      if (!courseModel.studentIds.includes(studentId)) {
        studentModel.enrolledCourses.push(courseId)
        await context.StudentCollection.updateOne(
          {_id: new ObjectId(studentId)},
          {$set: {enrolledCourses: studentModel.enrolledCourses}}
        )
  
        courseModel.studentIds.push(studentId)
        await context.CourseCollection.updateOne(
          {_id: new ObjectId(courseId)},
          {$set: {studentIds:courseModel.studentIds}}
        )  
      }

      return formModelToCourseGQ(courseModel, context.StudentCollection, context.TeacherCollection);
    },
    removeStudentFromCourse: async (
      _: unknown,
      args: { studentId: string; courseId: string },
      context: {
        StudentCollection: Collection<StudentModel>,
        CourseCollection: Collection<CourseModel>,
        TeacherCollection: Collection<TeacherModel>,
      },
    ): Promise<CourseGQ> => {
      const { studentId, courseId } = args;
      const studentModel = await context.StudentCollection.findOne({_id: new ObjectId(studentId)})
      if(!studentModel){
        throw new Error("no se encontró")
      }
      const courseModel = await context.CourseCollection.findOne({_id: new ObjectId(courseId)})
      if(!courseModel){
        throw new Error("no se encontró")
      }

      studentModel.enrolledCourses = studentModel.enrolledCourses.filter(id => id !== courseId);
      await context.StudentCollection.updateOne(
        { _id: new ObjectId(studentId) },
        { $set: { enrolledCourses: studentModel.enrolledCourses } }
      );

      courseModel.studentIds = courseModel.studentIds.filter(id => id !== studentId);
      await context.CourseCollection.updateOne(
        { _id: new ObjectId(courseId) },
        { $set: { studentIds: courseModel.studentIds } }
      );
    
      return formModelToCourseGQ(courseModel, context.StudentCollection, context.TeacherCollection);
    },    

    deleteStudent: async (
      _: unknown,
      args: { studentId: string},
      context: {
        StudentCollection: Collection<StudentModel>,
        CourseCollection: Collection<CourseModel>,
        TeacherCollection: Collection<TeacherModel>,
      },
    ): Promise<boolean> => {
      const { studentId } = args;
      const studentModel = await context.StudentCollection.findOne({_id: new ObjectId(studentId)})
      if(!studentModel){
        throw new Error("no se encontró")
      }
      
      const courseModels = await context.CourseCollection.find({
        _id: { $in: studentModel.enrolledCourses.map(courseId => new ObjectId(courseId)) }

      }).toArray();
      
      if(courseModels.length>0){
        courseModels.map(p => p.studentIds.filter(p=> p !== studentId))
        await Promise.all(
          courseModels.map(async (courseModel) => {
            const updatedStudentIds = courseModel.studentIds.filter(
              (id) => id.toString() !== studentId
            );
      
            // Update the course document with the new studentIds array
            await context.CourseCollection.updateOne(
              { _id: new ObjectId(courseModel._id) },
              { $set: { studentIds: updatedStudentIds } }
            );
          })
        );
      }

      await context.StudentCollection.deleteOne({
        _id: new ObjectId(studentId),
      });

      return true;
    },  

    createStudent: async (
        _: unknown,
        args: { name: string; email: string },
        context: {
            StudentCollection: Collection<StudentModel>;
        },
      ): Promise<Student> => {
        const { name, email } = args;
        const { insertedId } = await context.StudentCollection.insertOne({
          name,
          email,
          enrolledCourses: []
        });
        const studentModel = {
          _id: insertedId,
          name,
          email,
          enrolledCourses: []
        };
        return formModelToStudent(studentModel!);
      },
    createTeacher: async (
        _: unknown,
        args: { name: string; email: string },
        context: {
            TeacherCollection: Collection<TeacherModel>,
            CourseCollection: Collection<CourseModel> 
        },
        ): Promise<TeacherGQ> => {
        const { name, email } = args;
        const { insertedId } = await context.TeacherCollection.insertOne({
            name,
            email,
            coursesTaught: []
        });
        const teacherModel = {
            _id: insertedId,
            name,
            email,
            coursesTaught: []
        };
        return formModelToTeacherGQ(teacherModel, context.CourseCollection);
    },
    createCourse: async (
        _: unknown,
        args: { title: string; description: string, teacherId: string },
        context: {
            TeacherCollection: Collection<TeacherModel>;
            CourseCollection: Collection<CourseModel>;
            StudentCollection: Collection<StudentModel>;
        },
        ): Promise<CourseGQ> => {
        const { title, description, teacherId } = args;
        
        //teacherId existe?:
        const teacherdb = await context.TeacherCollection.findOne({
            _id: new ObjectId(teacherId),
          });

        console.info(teacherId)
        if(!teacherdb){
            console.info("Que te peines")
            throw new Error("Teacher not found")
        }
        //Insertar course
        const { insertedId } = await context.CourseCollection.insertOne({
          title,
          description,
          teacherId,
          studentIds: []
        });
 
        teacherdb.coursesTaught.push(insertedId.toString());
        //reemplazar teachercollection _id: new ObjectId(teacherId) con teacher db
            // Update the teacher in the TeacherCollection with the new coursesTaught array
        await context.TeacherCollection.updateOne(
          { _id: new ObjectId(teacherId) },
          {
              $set: {
                  coursesTaught: teacherdb.coursesTaught,
              },
          }
      );

        const CourseModel = {
            _id: insertedId,
            title,
            description,
            teacherId,
            studentIds: []
        };
        return formModelToCourseGQ(CourseModel, context.StudentCollection, context.TeacherCollection);
    },


  },
};