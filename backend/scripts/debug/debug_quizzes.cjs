const { sequelize, Usuario, QuizAsignacion, Quiz, Materia } = require('./server/models');

const checkAssignments = async () => {
    try {
        const studentName = 'Victoria';
        const users = await Usuario.findAll({
            where: sequelize.where(sequelize.fn('lower', sequelize.col('nombre')), 'LIKE', `%${studentName.toLowerCase()}%`)
        });

        if (users.length === 0) {
            console.log("No user found with name Victoria");
            return;
        }

        for (const user of users) {
             console.log(`Checking user: ${user.nombre} (ID: ${user.id_usuario})`);
             const assignments = await QuizAsignacion.findAll({
                 where: { fk_id_alumno: user.id_usuario },
                 include: [
                    { 
                        model: Quiz, 
                        as: 'quiz',
                        include: [{ model: Materia, as: 'materia' }] // Removed attributes to see all
                    }
                ]
             });

             console.log(`Found ${assignments.length} assignments.`);
             assignments.forEach(a => {
                 console.log(` - Quiz: ${a.quiz ? a.quiz.titulo : 'NULL (Association Error?)'} | Estatus: ${a.estatus}`);
             });
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
};

checkAssignments();
