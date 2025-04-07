import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";

export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;

        if (!jobId) {
            return res.status(400).json({
                message: "Job ID is required",
                success: false
            });
        }

        // Check for existing application
        const existingApp = await Application.findOne({ 
            job: jobId, 
            applicant: userId 
        });
        if (existingApp) {
            return res.status(400).json({
                message: "You have already applied for this job",
                success: false,
                applicationId: existingApp._id
            });
        }

        // Verify job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        // Check CGPA requirements
        const user = await User.findById(userId);
        if (user.role === 'student' && job.minCGPA && user.cgpa < job.minCGPA) {
            return res.status(403).json({
                message: `Your CGPA (${user.cgpa.toFixed(2)}) does not meet the minimum requirement (${job.minCGPA.toFixed(2)})`,
                success: false,
                requiredCGPA: job.minCGPA,
                userCGPA: user.cgpa
            });
        }

        // Create new application
        const application = await Application.create({
            job: jobId,
            applicant: userId,
            status: "pending"
        });

        // Initialize applications array if it doesn't exist
        if (!job.applications) {
            job.applications = [];
        }
        
        // Update applications and count
        job.applications.push(application._id);
        job.totalApplicants = job.applications.length;
        await job.save();

        return res.status(201).json({
            message: "Application submitted successfully!",
            success: true,
            application,
            jobTitle: job.title
        });

    } catch (error) {
        console.error('Application Error:', error);
        return res.status(500).json({
            message: error.message || "Application failed",
            success: false,
            error: error.message
        });
    }
};
export const getAppliedJobs = async (req,res) => {
    try {
        const userId = req.id;
        const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'company',
                options:{sort:{createdAt:-1}},
            }
        });
        if(!application){
            return res.status(404).json({
                message:"No Applications",
                success:false
            })
        };
        return res.status(200).json({
            application,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}
// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req,res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:'applications',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        return res.status(200).json({
            job, 
            succees:true
        });
    } catch (error) {
        console.log(error);
    }
}
export const updateStatus = async (req,res) => {
    try {
        const {status} = req.body;
        const applicationId = req.params.id;
        if(!status){
            return res.status(400).json({
                message:'status is required',
                success:false
            })
        };

        // find the application by applicantion id
        const application = await Application.findOne({_id:applicationId});
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        // update the status
        application.status = status.toLowerCase();
        await application.save();

        return res.status(200).json({
            message:"Status updated successfully.",
            success:true
        });

    } catch (error) {
        console.log(error);
    }
}