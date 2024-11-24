import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const identifyController = async (req, res) => {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        return res.status(400).send({"message":"Either email or phoneNumber is required"})
    }

    try {

        const existingContacts = await prisma.contact.findFirst({
            where: {
                AND: [
                    { email },
                    { phoneNumber },
                ],
            },
        });


        const matchingContact = await prisma.contact.findFirst({
            where: {
                OR: [
                    { email },
                    { phoneNumber },
                ],
            }
        });


        if (!existingContacts && !matchingContact) {
            await prisma.contact.create({
                data: { email, phoneNumber },
            });
        }else if(!existingContacts && matchingContact){
            if (matchingContact.linkedId){
                await prisma.contact.create({
                    data: { email, phoneNumber , linkedId: matchingContact.linkedId , linkPrecedence: "secondary" },
                })
            }
            else{
                await prisma.contact.create({
                    data: { email, phoneNumber , linkedId: matchingContact.id , linkPrecedence: "secondary" },
                })
            }
        }


        const linkedId = matchingContact ? matchingContact.linkedId ? matchingContact.linkedId :matchingContact.id : -1;

        const contacts = await prisma.contact.findMany({
            where: {
                OR:[
                    {id : linkedId},
                    {email},
                    { phoneNumber },
                    {linkedId}
                ]
            },
            orderBy: {
                createdAt: 'asc',
            }
        })

        const primaryContact = contacts[0];
        const primaryContactId = primaryContact.id;

        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];

            if (i === 0) {
                if (contact.linkPrecedence !== 'primary') {
                    await prisma.contact.update({
                        where: { id: contact.id },
                        data: {
                            linkPrecedence: 'primary',
                            linkedId: null,
                        },
                    });
                }
            } else {
                if (contact.linkPrecedence === 'primary' || contact.linkedId !== primaryContactId) {
                    await prisma.contact.update({
                        where: { id: contact.id },
                        data: {
                            linkPrecedence: 'secondary',
                            linkedId: primaryContactId,
                        },
                    });
                }
            }
        }

        const response = {
            primaryContactId,
            emails: [primaryContact.email],
            phoneNumbers: [primaryContact.phoneNumber],
            secondaryContactIds:[]
        };

        for (let idx = 0; idx < contacts.length; idx++) {
            let uniqueEmailCheck = true;
            for (let j = 0 ; j < response.emails.length; j++) {
                if (response.emails[j] === contacts[idx].email) {
                    uniqueEmailCheck = false;
                    break
                }
            }
            if (uniqueEmailCheck){
                response.emails.push(contacts[idx].email)
            }


            let uniquePhoneNumberCheck = true;
            for (let j = 0 ; j < response.phoneNumbers.length; j++) {
                if (response.phoneNumbers[j] === contacts[idx].phoneNumber) {
                    uniquePhoneNumberCheck = false;
                    break
                }
            }
            if (uniquePhoneNumberCheck) {
                response.phoneNumbers.push(contacts[idx].phoneNumber)
            }

            if (idx > 0){
                response.secondaryContactIds.push(contacts[idx].id)
            }
        }
        res.status(200).json(response);
    } catch (error) {
        // console.log(error.message);
        res.status(500).json({ error: 'An error occurred while processing the contacts.' });
    }
};

export default identifyController;
