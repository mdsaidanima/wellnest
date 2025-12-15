package com.wellnest.wellnest.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String authorName;
    private Long authorId;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    @JsonIgnore
    private BlogPost blogPost;

    public Comment() {
        this.createdAt = LocalDateTime.now();
    }

    public Comment(String content, String authorName, Long authorId, BlogPost blogPost) {
        this.content = content;
        this.authorName = authorName;
        this.authorId = authorId;
        this.blogPost = blogPost;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public BlogPost getBlogPost() { return blogPost; }
    public void setBlogPost(BlogPost blogPost) { this.blogPost = blogPost; }
}
