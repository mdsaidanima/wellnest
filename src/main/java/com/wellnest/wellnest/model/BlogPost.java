package com.wellnest.wellnest.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
public class BlogPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    @Column(length = 2000)
    private String content;
    
    private String authorName;
    private Long authorId;
    
    private String category; // e.g., "Nutrition", "Fitness"
    private String imageUrl; // Cover image for the post
    private int likesCount = 0;
    
    private LocalDateTime createdAt;
    
    // "ARTICLE" (Created by Trainers/Admins) or "USER_POST" (Community)
    private String postType; 

    @OneToMany(mappedBy = "blogPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments;

    public BlogPost() {}

    // Constructor with image
    public BlogPost(String title, String content, String authorName, Long authorId, String category, String postType, String imageUrl) {
        this.title = title;
        this.content = content;
        this.authorName = authorName;
        this.authorId = authorId;
        this.category = category;
        this.postType = postType;
        this.imageUrl = imageUrl;
        this.createdAt = LocalDateTime.now();
    }
    
    // Keep old constructor for compatibility if needed (without image)
    public BlogPost(String title, String content, String authorName, Long authorId, String category, String postType) {
        this(title, content, authorName, authorId, category, postType, null);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public int getLikesCount() { return likesCount; }
    public void setLikesCount(int likesCount) { this.likesCount = likesCount; }
    public void incrementLikes() { this.likesCount++; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getPostType() { return postType; }
    public void setPostType(String postType) { this.postType = postType; }
}
